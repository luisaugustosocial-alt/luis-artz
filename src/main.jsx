import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

const services = [
  { id: 'social', name: 'Social Media', price: 650 },
  { id: 'design', name: 'Design Gráfico', price: 250 },
  { id: 'site', name: 'Desenvolvimento de Sites', price: 1000 },
  { id: 'landing', name: 'Landing Page', price: 700 }
]

function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function App() {
  const [selected, setSelected] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const total = useMemo(
    () => services
      .filter(service => selected.includes(service.id))
      .reduce((sum, service) => sum + service.price, 0),
    [selected]
  )

  function toggle(id) {
    setSelected(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    )
  }

  function sendBudget(event) {
    event.preventDefault()

    const chosen = services.filter(service => selected.includes(service.id))

    if (!name || !phone || chosen.length === 0) {
      alert('Preencha seu nome, WhatsApp e selecione pelo menos um serviço.')
      return
    }

    const text = [
      `Olá! Meu nome é ${name}.`,
      'Gostaria de solicitar um orçamento para:',
      ...chosen.map(service => `• ${service.name} — ${money(service.price)}`),
      `Pré-orçamento estimado: ${money(total)}`,
      `Meu WhatsApp: ${phone}`
    ].join('\n')

    window.open(
      `https://wa.me/5577998674715?text=${encodeURIComponent(text)}`,
      '_blank'
    )
  }

  return (
    <div className="site">
      <header className="header">
        <a className="logo" href="#inicio">Luís Artz<span>.</span></a>

        <nav>
          <a href="#sobre">Sobre</a>
          <a href="#servicos">Serviços</a>
          <a href="#portfolio">Portfólio</a>
          <a href="#orcamento">Pré-orçamento</a>
          <a href="#contato">Contato</a>
        </nav>
      </header>

      <main>
        <section id="inicio" className="hero">
          <div className="heroText">
            <p className="eyebrow">SOCIAL MEDIA • DESIGN • WEB</p>
            <h1>Comunicação que ganha <span>forma, presença e resultado.</span></h1>
            <p className="lead">
              Social Media, Designer Gráfico e Desenvolvedor de Sites.
              Crio soluções digitais para marcas, profissionais e negócios.
            </p>

            <div className="actions">
              <a className="btn primary" href="#portfolio">Ver portfólio</a>
              <a className="btn ghost" href="#orcamento">Pedir orçamento</a>
            </div>
          </div>

          <div className="heroCard">
            <small>OLÁ, EU SOU</small>
            <h2>Luís Artz</h2>
            <p>Estratégia, design e desenvolvimento para sua presença digital.</p>
          </div>
        </section>

        <section id="sobre" className="section about">
          <div>
            <p className="tag">QUEM SOU</p>
            <h2>Crio experiências digitais que aproximam marcas e pessoas.</h2>
          </div>
          <p>
            Trabalho com Social Media, Design Gráfico e Desenvolvimento de Sites,
            unindo estratégia, identidade visual e tecnologia para criar projetos
            profissionais e funcionais.
          </p>
        </section>

        <section id="servicos" className="section dark">
          <p className="tag light">O QUE EU FAÇO</p>
          <h2>Serviços</h2>

          <div className="grid">
            {services.map(service => (
              <article className="card" key={service.id}>
                <h3>{service.name}</h3>
                <p>
                  Soluções personalizadas para fortalecer sua presença e comunicação digital.
                </p>
                <strong>A partir de {money(service.price)}</strong>
              </article>
            ))}
          </div>
        </section>

        <section id="portfolio" className="section">
          <p className="tag">PORTFÓLIO</p>
          <h2>Alguns trabalhos</h2>

          <div className="portfolio">
            <div className="work"><span>Design Gráfico</span><h3>Identidade Visual</h3></div>
            <div className="work"><span>Social Media</span><h3>Gestão de Conteúdo</h3></div>
            <div className="work"><span>Web</span><h3>Site Institucional</h3></div>
          </div>
        </section>

        <section id="orcamento" className="section budget">
          <div>
            <p className="tag">PRÉ-ORÇAMENTO</p>
            <h2>Monte uma estimativa do seu projeto.</h2>
            <p>
              Selecione os serviços desejados. O valor é uma estimativa inicial.
            </p>

            <div className="choices">
              {services.map(service => (
                <label
                  className={selected.includes(service.id) ? 'choice active' : 'choice'}
                  key={service.id}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(service.id)}
                    onChange={() => toggle(service.id)}
                  />
                  <span>{service.name}</span>
                  <strong>{money(service.price)}</strong>
                </label>
              ))}
            </div>
          </div>

          <form className="budgetCard" onSubmit={sendBudget}>
            <h3>Seu pré-orçamento</h3>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
            />
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Seu WhatsApp"
            />

            <div className="total">
              <span>Estimativa</span>
              <strong>{money(total)}</strong>
            </div>

            <button className="btn primary full" type="submit">
              Enviar pelo WhatsApp
            </button>
          </form>
        </section>

        <section id="contato" className="section contact">
          <div>
            <p className="tag">CONTATO</p>
            <h2>Vamos criar algo juntos?</h2>
          </div>

          <a className="btn primary" href="https://wa.me/5577998674715" target="_blank">
            Falar no WhatsApp
          </a>
        </section>
      </main>

      <footer>
        <strong>Luís Artz.</strong>
        <span>© {new Date().getFullYear()} — Todos os direitos reservados.</span>
      </footer>
    </div>
  )
}

const root = document.getElementById('root')

if (!root) {
  document.body.innerHTML = '<h1>Erro: elemento #root não encontrado.</h1>'
} else {
  ReactDOM.createRoot(root).render(<App />)
}
