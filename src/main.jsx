import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  BriefcaseBusiness,
  Code2,
  ExternalLink,
  Instagram,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Palette,
  PencilLine,
  Save,
  Smartphone,
  Trash2,
  UserRound,
  X
} from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
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
  setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import './styles.css';

const DEFAULT_SITE = {
  name: 'Luís Artz',
  headline: 'Social Media, Designer Gráfico & Desenvolvedor de Sites',
  intro: 'Transformo ideias em presença digital com estratégia, identidade visual e experiências digitais que conectam marcas e pessoas.',
  about: 'Atuo com Social Media, Design Gráfico e Desenvolvimento de Sites, criando soluções digitais para marcas, profissionais e negócios que querem se posicionar melhor, comunicar com clareza e vender mais.',
  whatsapp: '5577998674715',
  instagram: 'https://instagram.com/',
  email: 'contato@seudominio.com',
  services: [
    { id: 'social', title: 'Gestão de Social Media', description: 'Planejamento, calendário editorial, criação e acompanhamento de conteúdo.', price: 650 },
    { id: 'design', title: 'Design Gráfico', description: 'Cards, identidades visuais, apresentações, materiais institucionais e campanhas.', price: 250 },
    { id: 'site', title: 'Desenvolvimento de Site', description: 'Sites responsivos, portfólios, páginas institucionais e páginas de conversão.', price: 1000 },
    { id: 'landing', title: 'Landing Page', description: 'Página objetiva para campanhas, serviços, lançamentos ou captação de clientes.', price: 700 },
    { id: 'reels', title: 'Pacote de Reels', description: 'Edição e finalização de vídeos verticais para redes sociais.', price: 300 }
  ],
  portfolio: [
    { id: 'p1', title: 'Identidade Visual', category: 'Design Gráfico', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1000&q=80' },
    { id: 'p2', title: 'Gestão de Conteúdo', category: 'Social Media', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1000&q=80' },
    { id: 'p3', title: 'Site Institucional', category: 'Desenvolvimento Web', image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1000&q=80' }
  ]
};

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

function App() {
  const [site, setSite] = useState(DEFAULT_SITE);
  const [selected, setSelected] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [client, setClient] = useState({ name: '', phone: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return unsubscribe;
  }, []);

  useEffect(() => {
    async function loadSite() {
      try {
        const snap = await getDoc(doc(db, 'site', 'content'));
        if (snap.exists()) setSite({ ...DEFAULT_SITE, ...snap.data() });
      } catch (error) {
        console.warn('Usando conteúdo padrão. Configure o Firebase para ativar o banco.', error);
      } finally {
        setLoading(false);
      }
    }
    loadSite();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadRequests();
  }, [user]);

  async function loadRequests() {
    try {
      const q = query(collection(db, 'budgetRequests'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      setMessage('Não foi possível carregar os orçamentos. Confira as regras do Firestore.');
    }
  }

  const selectedServices = useMemo(
    () => site.services.filter((service) => selected.includes(service.id)),
    [site.services, selected]
  );

  const total = useMemo(
    () => selectedServices.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [selectedServices]
  );

  function toggleService(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function sendBudget(e) {
    e.preventDefault();
    if (!client.name || !client.phone || selectedServices.length === 0) {
      setMessage('Preencha nome e telefone e selecione pelo menos um serviço.');
      return;
    }

    const payload = {
      clientName: client.name,
      clientPhone: client.phone,
      notes: client.notes,
      services: selectedServices,
      total,
      status: 'novo',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'budgetRequests'), payload);
    } catch (error) {
      console.warn('Orçamento não salvo no Firestore. O WhatsApp será aberto normalmente.', error);
    }

    const text = [
      `Olá! Meu nome é ${client.name}.`,
      'Gostaria de solicitar um orçamento para:',
      ...selectedServices.map((service) => `• ${service.title} — ${formatBRL(service.price)}`),
      `Pré-orçamento estimado: ${formatBRL(total)}`,
      client.notes ? `Observações: ${client.notes}` : '',
      `Telefone para contato: ${client.phone}`
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
    setMessage('Pré-orçamento gerado e direcionado ao WhatsApp.');
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, login.email, login.password);
      setMessage('Login realizado com sucesso.');
    } catch (error) {
      setMessage('E-mail ou senha inválidos.');
    }
  }

  async function saveSite() {
    try {
      await setDoc(doc(db, 'site', 'content'), site, { merge: true });
      setMessage('Alterações salvas.');
    } catch (error) {
      setMessage('Não foi possível salvar. Confira suas permissões no Firebase.');
    }
  }

  async function removeRequest(id) {
    try {
      await deleteDoc(doc(db, 'budgetRequests', id));
      setRequests((current) => current.filter((item) => item.id !== id));
    } catch {
      setMessage('Não foi possível excluir o orçamento.');
    }
  }

  function updateService(index, field, value) {
    const services = [...site.services];
    services[index] = { ...services[index], [field]: field === 'price' ? Number(value) : value };
    setSite({ ...site, services });
  }

  function updatePortfolio(index, field, value) {
    const portfolio = [...site.portfolio];
    portfolio[index] = { ...portfolio[index], [field]: value };
    setSite({ ...site, portfolio });
  }

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <>
      <header className="header">
        <a href="#inicio" className="brand">{site.name}<span>.</span></a>
        <nav className={menuOpen ? 'nav open' : 'nav'}>
          <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
          <a href="#servicos" onClick={() => setMenuOpen(false)}>Serviços</a>
          <a href="#portfolio" onClick={() => setMenuOpen(false)}>Portfólio</a>
          <a href="#orcamento" onClick={() => setMenuOpen(false)}>Pré-orçamento</a>
          <a href="#contato" onClick={() => setMenuOpen(false)}>Contato</a>
          <button className="admin-link" onClick={() => { setAdminOpen(true); setMenuOpen(false); }}>Área administrativa</button>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <main>
        <section id="inicio" className="hero section-shell">
          <div className="hero-copy">
            <span className="eyebrow">COMUNICAÇÃO • DESIGN • TECNOLOGIA</span>
            <h1>Ideias que ganham <span>forma, presença e resultado.</span></h1>
            <p>{site.intro}</p>
            <div className="hero-actions">
              <a className="button primary" href="#portfolio">Ver meus trabalhos</a>
              <a className="button secondary" href="#orcamento">Solicitar pré-orçamento</a>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-orb"></div>
            <div className="hero-card-content">
              <p>Olá, eu sou</p>
              <h2>{site.name}</h2>
              <strong>{site.headline}</strong>
            </div>
          </div>
        </section>

        <section id="sobre" className="section section-shell about-grid">
          <div>
            <span className="section-tag">Quem sou</span>
            <h2>Estratégia criativa para marcas que querem crescer no digital.</h2>
          </div>
          <p className="large-text">{site.about}</p>
        </section>

        <section id="servicos" className="section dark-section">
          <div className="section-shell">
            <span className="section-tag light">O que eu faço</span>
            <h2 className="light-title">Serviços que conectam comunicação, estética e tecnologia.</h2>
            <div className="service-grid">
              {site.services.map((service, index) => {
                const icons = [Smartphone, Palette, Code2, LayoutDashboard, PencilLine];
                const Icon = icons[index % icons.length];
                return (
                  <article className="service-card" key={service.id}>
                    <Icon size={28} />
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <span>A partir de {formatBRL(service.price)}</span>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="portfolio" className="section section-shell">
          <span className="section-tag">Portfólio</span>
          <div className="section-heading-row">
            <h2>Alguns trabalhos e projetos.</h2>
            <p>Uma seleção de peças de design, projetos de social media e soluções digitais.</p>
          </div>
          <div className="portfolio-grid">
            {site.portfolio.map((item) => (
              <article className="portfolio-card" key={item.id}>
                <img src={item.image} alt={item.title} />
                <div className="portfolio-overlay">
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <ExternalLink size={20} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="orcamento" className="section budget-section">
          <div className="section-shell budget-grid">
            <div>
              <span className="section-tag">Pré-orçamento</span>
              <h2>Monte uma estimativa rápida do seu projeto.</h2>
              <p>Selecione os serviços desejados. O valor abaixo é uma estimativa inicial e pode variar conforme a complexidade, o prazo e o escopo final.</p>
              <div className="budget-options">
                {site.services.map((service) => (
                  <label className={selected.includes(service.id) ? 'budget-option selected' : 'budget-option'} key={service.id}>
                    <input type="checkbox" checked={selected.includes(service.id)} onChange={() => toggleService(service.id)} />
                    <div>
                      <strong>{service.title}</strong>
                      <small>{formatBRL(service.price)}</small>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <form className="budget-card" onSubmit={sendBudget}>
              <h3>Seu pré-orçamento</h3>
              <input placeholder="Seu nome" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
              <input placeholder="WhatsApp" value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
              <textarea placeholder="Conte um pouco sobre o que você precisa" value={client.notes} onChange={(e) => setClient({ ...client, notes: e.target.value })}></textarea>
              <div className="budget-total">
                <span>Estimativa inicial</span>
                <strong>{formatBRL(total)}</strong>
              </div>
              <button className="button primary full" type="submit"><MessageCircle size={19} /> Enviar pelo WhatsApp</button>
              <small>O pedido também pode ser registrado no painel administrativo quando o Firebase estiver configurado.</small>
            </form>
          </div>
        </section>

        <section id="contato" className="section section-shell contact-box">
          <div>
            <span className="section-tag">Contato</span>
            <h2>Vamos transformar sua ideia em um projeto profissional?</h2>
          </div>
          <div className="contact-links">
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank"><MessageCircle /> WhatsApp</a>
            <a href={site.instagram} target="_blank"><Instagram /> Instagram</a>
            <a href={`mailto:${site.email}`}><Mail /> {site.email}</a>
          </div>
        </section>
      </main>

      <footer>
        <div className="section-shell footer-inner">
          <strong>{site.name}.</strong>
          <span>© {new Date().getFullYear()} — Todos os direitos reservados.</span>
        </div>
      </footer>

      {message && <div className="toast" onClick={() => setMessage('')}>{message}</div>}

      {adminOpen && (
        <div className="modal-backdrop">
          <div className="admin-modal">
            <button className="close-admin" onClick={() => setAdminOpen(false)}><X /></button>
            {!user ? (
              <form className="login-box" onSubmit={handleLogin}>
                <LogIn size={32} />
                <h2>Área administrativa</h2>
                <p>Entre com o usuário cadastrado no Firebase Authentication.</p>
                <input type="email" placeholder="E-mail" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
                <input type="password" placeholder="Senha" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
                <button className="button primary full">Entrar</button>
              </form>
            ) : (
              <div className="admin-dashboard">
                <div className="admin-topbar">
                  <div><span>Painel administrativo</span><h2>Gerenciar site</h2></div>
                  <button className="logout-button" onClick={() => signOut(auth)}><LogOut size={18} /> Sair</button>
                </div>

                <div className="admin-section">
                  <h3>Conteúdo principal</h3>
                  <div className="admin-form-grid">
                    <label>Nome<input value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })} /></label>
                    <label>Título profissional<input value={site.headline} onChange={(e) => setSite({ ...site, headline: e.target.value })} /></label>
                    <label className="wide">Texto inicial<textarea value={site.intro} onChange={(e) => setSite({ ...site, intro: e.target.value })}></textarea></label>
                    <label className="wide">Sobre<textarea value={site.about} onChange={(e) => setSite({ ...site, about: e.target.value })}></textarea></label>
                    <label>WhatsApp<input value={site.whatsapp} onChange={(e) => setSite({ ...site, whatsapp: e.target.value })} /></label>
                    <label>Instagram<input value={site.instagram} onChange={(e) => setSite({ ...site, instagram: e.target.value })} /></label>
                    <label>E-mail<input value={site.email} onChange={(e) => setSite({ ...site, email: e.target.value })} /></label>
                  </div>
                </div>

                <div className="admin-section">
                  <h3>Serviços e preços</h3>
                  <div className="admin-list">
                    {site.services.map((service, index) => (
                      <div className="admin-list-item" key={service.id}>
                        <input value={service.title} onChange={(e) => updateService(index, 'title', e.target.value)} />
                        <input value={service.description} onChange={(e) => updateService(index, 'description', e.target.value)} />
                        <input type="number" value={service.price} onChange={(e) => updateService(index, 'price', e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-section">
                  <h3>Portfólio</h3>
                  <div className="admin-list">
                    {site.portfolio.map((item, index) => (
                      <div className="admin-list-item portfolio-edit" key={item.id}>
                        <input value={item.title} onChange={(e) => updatePortfolio(index, 'title', e.target.value)} />
                        <input value={item.category} onChange={(e) => updatePortfolio(index, 'category', e.target.value)} />
                        <input value={item.image} onChange={(e) => updatePortfolio(index, 'image', e.target.value)} placeholder="URL da imagem" />
                      </div>
                    ))}
                  </div>
                </div>

                <button className="button primary" onClick={saveSite}><Save size={18} /> Salvar alterações</button>

                <div className="admin-section">
                  <div className="admin-section-title"><h3>Orçamentos recebidos</h3><button onClick={loadRequests}>Atualizar</button></div>
                  {requests.length === 0 ? <p>Nenhum orçamento registrado.</p> : requests.map((request) => (
                    <article className="request-card" key={request.id}>
                      <div>
                        <strong>{request.clientName}</strong>
                        <span>{request.clientPhone}</span>
                        <p>{request.services?.map((s) => s.title).join(', ')}</p>
                        <b>{formatBRL(request.total)}</b>
                      </div>
                      <div className="request-actions">
                        <a href={`https://wa.me/${String(request.clientPhone || '').replace(/\D/g, '')}`} target="_blank"><MessageCircle size={18} /></a>
                        <button onClick={() => removeRequest(request.id)}><Trash2 size={18} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
