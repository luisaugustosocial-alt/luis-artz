import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore'
import { auth, db, firebaseReady } from './firebase'
import './styles.css'

const DEFAULT_SITE = {
  name: 'Luís Artz',
  headline: 'Social Media, Designer Gráfico & Desenvolvedor de Sites',
  intro: 'Transformo ideias em presença digital com estratégia, identidade visual e experiências digitais que conectam marcas e pessoas.',
  about: 'Trabalho com Social Media, Design Gráfico e Desenvolvimento de Sites, unindo estratégia, identidade visual e tecnologia para criar projetos profissionais e funcionais.',
  whatsapp: '5577998674715',
  instagram: 'https://instagram.com/',
  email: 'contato@seudominio.com',
  services: [
    { id: 'social', name: 'Social Media', description: 'Planejamento, criação e gestão de conteúdo para redes sociais.', price: 650 },
    { id: 'design', name: 'Design Gráfico', description: 'Cards, identidades visuais e materiais gráficos.', price: 250 },
    { id: 'site', name: 'Desenvolvimento de Sites', description: 'Sites responsivos, portfólios e páginas institucionais.', price: 1000 },
    { id: 'landing', name: 'Landing Page', description: 'Páginas para campanhas, serviços e conversão.', price: 700 }
  ],
  portfolio: [
    { id: 'p1', title: 'Identidade Visual', category: 'Design Gráfico', image: '' },
    { id: 'p2', title: 'Gestão de Conteúdo', category: 'Social Media', image: '' },
    { id: 'p3', title: 'Site Institucional', category: 'Web', image: '' }
  ]
}

function money(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

function App() {
  const [site, setSite] = useState(DEFAULT_SITE)
  const [selected, setSelected] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [adminOpen, setAdminOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [login, setLogin] = useState({ email: '', password: '' })
  const [requests, setRequests] = useState([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!firebaseReady || !auth) return
    const unsubscribe = onAuthStateChanged(auth, setUser)
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!firebaseReady || !db) return
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'site', 'content'))
        if (snap.exists()) {
          const data = snap.data()
          setSite({
            ...DEFAULT_SITE,
            ...data,
            services: Array.isArray(data.services) ? data.services : DEFAULT_SITE.services,
            portfolio: Array.isArray(data.portfolio) ? data.portfolio : DEFAULT_SITE.portfolio
          })
        }
      } catch (error) {
        console.warn('Conteúdo padrão mantido:', error)
      }
    })()
  }, [])

  useEffect(() => {
    if (user) loadRequests()
  }, [user])

  const chosen = useMemo(
    () => site.services.filter((service) => selected.includes(service.id)),
    [site.services, selected]
  )

  const total = useMemo(
    () => chosen.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [chosen]
  )

  function toggle(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  async function sendBudget(event) {
    event.preventDefault()

    if (!name || !phone || chosen.length === 0) {
      setNotice('Preencha nome, WhatsApp e selecione pelo menos um serviço.')
      return
    }

    if (firebaseReady && db) {
      try {
        await addDoc(collection(db, 'budgetRequests'), {
          clientName: name,
          clientPhone: phone,
          notes,
          services: chosen,
          total,
          status: 'novo',
          createdAt: serverTimestamp()
        })
      } catch (error) {
        console.warn('Não foi possível registrar o orçamento:', error)
      }
    }

    const text = [
      `Olá! Meu nome é ${name}.`,
      'Gostaria de solicitar um orçamento para:',
      ...chosen.map((service) => `• ${service.name} — ${money(service.price)}`),
      `Pré-orçamento estimado: ${money(total)}`,
      notes ? `Observações: ${notes}` : '',
      `Meu WhatsApp: ${phone}`
    ].filter(Boolean).join('\n')

    window.open(`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function doLogin(event) {
    event.preventDefault()
    if (!firebaseReady || !auth) return setNotice('Firebase indisponível no momento.')

    try {
      await signInWithEmailAndPassword(auth, login.email, login.password)
      setNotice('Login realizado.')
    } catch {
      setNotice('E-mail ou senha inválidos.')
    }
  }

  async function saveSite() {
    if (!firebaseReady || !db || !user) return
    try {
      await setDoc(doc(db, 'site', 'content'), site)
      setNotice('Alterações salvas.')
    } catch {
      setNotice('Não foi possível salvar.')
    }
  }

  async function loadRequests() {
    if (!firebaseReady || !db) return
    try {
      const q = query(collection(db, 'budgetRequests'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setRequests(snap.docs.map((item) => ({ id: item.id, ...item.data() })))
    } catch {
      setRequests([])
    }
  }

  async function removeRequest(id) {
    if (!db || !user) return
    try {
      await deleteDoc(doc(db, 'budgetRequests', id))
      setRequests((current) => current.filter((item) => item.id !== id))
    } catch {
      setNotice('Não foi possível excluir.')
    }
  }

  async function changeRequestStatus(id, status) {
    if (!db || !user) return
    try {
      await updateDoc(doc(db, 'budgetRequests', id), { status })
      setRequests((current) =>
        current.map((item) => item.id === id ? { ...item, status } : item)
      )
    } catch {
      setNotice('Não foi possível alterar o status.')
    }
  }

  function updateService(index, field, value) {
    const services = [...site.services]
    services[index] = { ...services[index], [field]: field === 'price' ? Number(value) : value }
    setSite({ ...site, services })
  }

  function addService() {
    setSite((current) => ({
      ...current,
      services: [...current.services, {
        id: `service-${Date.now()}`,
        name: 'Novo serviço',
        description: 'Descrição do serviço',
        price: 0
      }]
    }))
  }

  function removeService(index) {
    setSite((current) => ({
      ...current,
      services: current.services.filter((_, itemIndex) => itemIndex !== index)
    }))
  }

  function updatePortfolio(index, field, value) {
    const portfolio = [...site.portfolio]
    portfolio[index] = { ...portfolio[index], [field]: value }
    setSite({ ...site, portfolio })
  }

  function addPortfolioItem() {
    setSite((current) => ({
      ...current,
      portfolio: [...current.portfolio, {
        id: `portfolio-${Date.now()}`,
        title: 'Novo trabalho',
        category: 'Categoria',
        image: ''
      }]
    }))
  }

  function removePortfolioItem(index) {
    setSite((current) => ({
      ...current,
      portfolio: current.portfolio.filter((_, itemIndex) => itemIndex !== index)
    }))
  }

  return (
    <div className="site">
      <header className="header">
        <a className="logo" href="#inicio" onClick={() => setMobileMenuOpen(false)}>
          {site.name}<span>.</span>
        </a>

        <nav className={mobileMenuOpen ? 'mainNav mobileOpen' : 'mainNav'}>
          <a href="#sobre" onClick={() => setMobileMenuOpen(false)}>Sobre</a>
          <a href="#servicos" onClick={() => setMobileMenuOpen(false)}>Serviços</a>
          <a href="#portfolio" onClick={() => setMobileMenuOpen(false)}>Portfólio</a>
          <a href="#orcamento" onClick={() => setMobileMenuOpen(false)}>Pré-orçamento</a>
          <a href="#contato" onClick={() => setMobileMenuOpen(false)}>Contato</a>
          <button
            className="navAdmin"
            onClick={() => {
              setAdminOpen(true)
              setMobileMenuOpen(false)
            }}
          >
            Admin
          </button>
        </nav>

        <button
          className="mobileMenuButton"
          type="button"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((current) => !current)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      <main>
        <section id="inicio" className="hero">
          <div className="heroText">
            <p className="eyebrow">SOCIAL MEDIA • DESIGN • WEB</p>
            <h1>Comunicação que ganha <span>forma, presença e resultado.</span></h1>
            <p className="lead">{site.intro}</p>
            <div className="actions">
              <a className="btn primary" href="#portfolio">Ver portfólio</a>
              <a className="btn ghost" href="#orcamento">Pedir orçamento</a>
            </div>
          </div>
          <div className="heroCard heroPhotoCard">
            <img
              className="heroPhoto"
              src="/luis-artz.jpg"
              alt="Luís Artz"
            />
            <div className="heroPhotoOverlay">
              <small>OLÁ, EU SOU</small>
              <h2>{site.name}</h2>
              <p>{site.headline}</p>
            </div>
          </div>
        </section>

        <section id="sobre" className="section about">
          <div><p className="tag">QUEM SOU</p><h2>Crio experiências digitais que aproximam marcas e pessoas.</h2></div>
          <p>{site.about}</p>
        </section>

        <section id="servicos" className="section dark">
          <p className="tag light">O QUE EU FAÇO</p>
          <h2>Serviços</h2>
          <div className="grid">
            {site.services.map((service) => (
              <article className="card" key={service.id}>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <strong>A partir de {money(service.price)}</strong>
              </article>
            ))}
          </div>
        </section>

        <section id="portfolio" className="section">
          <p className="tag">PORTFÓLIO</p>
          <h2>Alguns trabalhos</h2>
          <div className="portfolio">
            {site.portfolio.map((item) => (
              <div
                className="work"
                key={item.id}
                style={item.image ? {
                  backgroundImage: `linear-gradient(rgba(7,25,45,.35), rgba(7,25,45,.75)), url(${item.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : undefined}
              >
                <span>{item.category}</span>
                <h3>{item.title}</h3>
              </div>
            ))}
          </div>
        </section>

        <section id="orcamento" className="section budget">
          <div>
            <p className="tag">PRÉ-ORÇAMENTO</p>
            <h2>Monte uma estimativa do seu projeto.</h2>
            <p>Selecione os serviços desejados. O valor é uma estimativa inicial.</p>
            <div className="choices">
              {site.services.map((service) => (
                <label className={selected.includes(service.id) ? 'choice active' : 'choice'} key={service.id}>
                  <input type="checkbox" checked={selected.includes(service.id)} onChange={() => toggle(service.id)} />
                  <span>{service.name}</span>
                  <strong>{money(service.price)}</strong>
                </label>
              ))}
            </div>
          </div>

          <form className="budgetCard" onSubmit={sendBudget}>
            <h3>Seu pré-orçamento</h3>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Seu WhatsApp" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conte um pouco sobre o projeto" />
            <div className="total"><span>Estimativa</span><strong>{money(total)}</strong></div>
            <button className="btn primary full" type="submit">Enviar pelo WhatsApp</button>
          </form>
        </section>

        <section id="contato" className="section contact">
          <div><p className="tag">CONTATO</p><h2>Vamos criar algo juntos?</h2></div>
          <a className="btn primary" href={`https://wa.me/${site.whatsapp}`} target="_blank">Falar no WhatsApp</a>
        </section>
      </main>

      <footer>
        <strong>{site.name}.</strong>
        <span>© {new Date().getFullYear()} — Todos os direitos reservados.</span>
      </footer>

      {notice && <div className="toast" onClick={() => setNotice('')}>{notice}</div>}

      {adminOpen && (
        <div className="modal">
          <div className="adminBox">
            <button className="close" onClick={() => setAdminOpen(false)}>×</button>

            {!user ? (
              <form onSubmit={doLogin} className="loginForm">
                <p className="tag">ADMINISTRAÇÃO</p>
                <h2>Entrar</h2>
                <input type="email" placeholder="E-mail" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
                <input type="password" placeholder="Senha" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
                <button className="btn primary full">Entrar</button>
              </form>
            ) : (
              <div className="dashboard">
                <div className="dashTop">
                  <div><p className="tag">PAINEL</p><h2>Gerenciar Luís Artz</h2></div>
                  <button className="btn ghost" onClick={() => signOut(auth)}>Sair</button>
                </div>

                <div className="adminSection">
                  <h3>Conteúdo</h3>
                  <input value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })} placeholder="Nome" />
                  <input value={site.headline} onChange={(e) => setSite({ ...site, headline: e.target.value })} placeholder="Título profissional" />
                  <textarea value={site.intro} onChange={(e) => setSite({ ...site, intro: e.target.value })} placeholder="Introdução" />
                  <textarea value={site.about} onChange={(e) => setSite({ ...site, about: e.target.value })} placeholder="Sobre" />
                  <input value={site.whatsapp} onChange={(e) => setSite({ ...site, whatsapp: e.target.value })} placeholder="WhatsApp" />
                  <input value={site.instagram} onChange={(e) => setSite({ ...site, instagram: e.target.value })} placeholder="Instagram" />
                  <input value={site.email} onChange={(e) => setSite({ ...site, email: e.target.value })} placeholder="E-mail" />
                </div>

                <div className="adminSection">
                  <div className="dashTop">
                    <h3>Serviços e valores</h3>
                    <button className="btn ghost" onClick={addService}>+ Adicionar serviço</button>
                  </div>

                  {site.services.map((service, index) => (
                    <div className="editRow serviceEdit" key={service.id}>
                      <input value={service.name} onChange={(e) => updateService(index, 'name', e.target.value)} />
                      <input value={service.description} onChange={(e) => updateService(index, 'description', e.target.value)} />
                      <input type="number" value={service.price} onChange={(e) => updateService(index, 'price', e.target.value)} />
                      <button className="smallBtn danger" onClick={() => removeService(index)}>Excluir</button>
                    </div>
                  ))}
                </div>

                <div className="adminSection">
                  <div className="dashTop">
                    <h3>Portfólio</h3>
                    <button className="btn ghost" onClick={addPortfolioItem}>+ Adicionar trabalho</button>
                  </div>

                  {site.portfolio.map((item, index) => (
                    <div className="editRow portfolioEdit" key={item.id}>
                      <input value={item.title} onChange={(e) => updatePortfolio(index, 'title', e.target.value)} placeholder="Título" />
                      <input value={item.category} onChange={(e) => updatePortfolio(index, 'category', e.target.value)} placeholder="Categoria" />
                      <input value={item.image || ''} onChange={(e) => updatePortfolio(index, 'image', e.target.value)} placeholder="URL da imagem" />
                      <button className="smallBtn danger" onClick={() => removePortfolioItem(index)}>Excluir</button>
                    </div>
                  ))}
                </div>

                <button className="btn primary" onClick={saveSite}>Salvar alterações</button>

                <div className="adminSection">
                  <div className="dashTop">
                    <h3>Orçamentos recebidos</h3>
                    <button className="btn ghost" onClick={loadRequests}>Atualizar</button>
                  </div>

                  {requests.length === 0 ? <p>Nenhum orçamento registrado.</p> : requests.map((request) => (
                    <article className="request" key={request.id}>
                      <div>
                        <strong>{request.clientName}</strong>
                        <span>{request.clientPhone}</span>
                        <p>{request.services?.map((service) => service.name).join(', ')}</p>
                        <b>{money(request.total)}</b>

                        <div className="statusRow">
                          <span className={`statusBadge status-${request.status || 'novo'}`}>
                            {request.status || 'novo'}
                          </span>
                          <select
                            value={request.status || 'novo'}
                            onChange={(e) => changeRequestStatus(request.id, e.target.value)}
                          >
                            <option value="novo">Novo</option>
                            <option value="respondido">Respondido</option>
                            <option value="fechado">Fechado</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <a className="smallBtn" href={`https://wa.me/${String(request.clientPhone || '').replace(/\D/g, '')}`} target="_blank">WhatsApp</a>
                        <button className="smallBtn danger" onClick={() => removeRequest(request.id)}>Excluir</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const root = document.getElementById('root')
if (!root) {
  document.body.innerHTML = '<h1>Erro: #root não encontrado.</h1>'
} else {
  ReactDOM.createRoot(root).render(<App />)
}
