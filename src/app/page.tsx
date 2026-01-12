const stats = [
  { label: "Planes personalizados", value: "+120" },
  { label: "Pacientes en seguimiento", value: "36" },
  { label: "Ajustes al mes", value: "4-6" }
];

const services = [
  {
    title: "Consulta inicial",
    description:
      "Evaluacion completa, objetivos claros y un plan alimenticio realista para tu estilo de vida."
  },
  {
    title: "Seguimiento inteligente",
    description:
      "Ajustes semanales, medicion de progreso y estrategias para mantener la motivacion."
  },
  {
    title: "Reeducacion alimentaria",
    description:
      "Aprende a elegir mejor, sin dietas extremas ni reglas imposibles."
  }
];

const steps = [
  {
    title: "Diagnostico",
    detail: "Datos clinicos, habitos y objetivos reales."
  },
  {
    title: "Plan hecho a medida",
    detail: "Menus, porciones y metas semanales."
  },
  {
    title: "Acompanamiento",
    detail: "Revision de avances y ajustes continuos."
  }
];

const expectations = [
  "Panel de paciente con registro y actualizacion de datos",
  "Graficas de progreso y recordatorios",
  "Material educativo y recetas",
  "Historial de consultas y recomendaciones"
];

export default function Home() {
  return (
    <main>
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-10 top-24 h-52 w-52 rounded-full bg-metal/30 blur-3xl" />
        <div className="absolute right-14 top-12 h-64 w-64 rounded-full bg-glow/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-metal/20 blur-3xl" />
      </div>

      <header className="px-6 pt-8 md:px-12">
        <div className="glass stripe mx-auto flex max-w-6xl items-center justify-between rounded-full px-6 py-3">
          <div className="font-[var(--font-display)] text-xl tracking-wide">
            Alahy Nutrition
          </div>
          <nav className="hidden gap-6 text-sm text-[color:var(--text-soft)] md:flex">
            <a className="transition hover:text-white" href="#servicios">
              Servicios
            </a>
            <a className="transition hover:text-white" href="#metodo">
              Metodo
            </a>
            <a className="transition hover:text-white" href="#futuro">
              Plataforma
            </a>
            <a className="transition hover:text-white" href="#contacto">
              Contacto
            </a>
          </nav>
        </div>
      </header>

      <section className="px-6 pb-16 pt-14 md:px-12">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="glass inline-flex items-center gap-3 rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--text-soft)]">
              Nutricion clinica y deportiva
            </div>
            <h1 className="font-[var(--font-display)] text-4xl leading-tight md:text-6xl">
              Planes nutricionales precisos para cambios reales
            </h1>
            <p className="max-w-xl text-lg text-[color:var(--text-soft)]">
              Erick David Alahy Rios Cervantes combina ciencia, empatia y
              tecnologia para acompanarte en cada etapa de tu progreso.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-full bg-glow px-6 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]">
                Agenda tu consulta
              </button>
              <button className="rounded-full border border-mist/40 px-6 py-3 text-sm font-semibold text-white transition hover:border-white">
                Ver planes
              </button>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="glass rounded-2xl px-4 py-5">
                  <div className="text-2xl font-semibold text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass relative overflow-hidden rounded-3xl p-8">
            <div className="absolute right-6 top-6 h-28 w-28 rounded-full border border-mist/40" />
            <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-3xl border border-mist/30 opacity-40" />
            <div className="space-y-6">
              <h2 className="font-[var(--font-display)] text-3xl">
                Consulta con direccion y seguimiento constante
              </h2>
              <p className="text-[color:var(--text-soft)]">
                Tu plan es flexible, medible y hecho con datos reales para que
                puedas sostener resultados en el tiempo.
              </p>
              <div className="space-y-4">
                <div className="rounded-2xl border border-mist/30 p-4">
                  <div className="text-sm uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                    Evaluacion inicial
                  </div>
                  <div className="mt-2 text-xl font-semibold">
                    60 minutos de diagnostico y objetivos
                  </div>
                </div>
                <div className="rounded-2xl border border-mist/30 p-4">
                  <div className="text-sm uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                    Seguimiento
                  </div>
                  <div className="mt-2 text-xl font-semibold">
                    Ajustes semanales y chat directo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="servicios" className="px-6 pb-16 md:px-12">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <div className="text-sm uppercase tracking-[0.3em] text-[color:var(--text-soft)]">
              Servicios
            </div>
            <h2 className="font-[var(--font-display)] text-3xl md:text-4xl">
              Un enfoque integral, humano y medible
            </h2>
            <p className="text-[color:var(--text-soft)]">
              Cada paciente recibe un plan segun su contexto, objetivos y estilo
              de vida. Aqui no hay plantillas vacias.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <div key={service.title} className="glass rounded-2xl p-6">
                <div className="text-xl font-semibold">{service.title}</div>
                <p className="mt-3 text-sm text-[color:var(--text-soft)]">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="metodo" className="px-6 pb-16 md:px-12">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_1fr]">
          <div className="glass rounded-3xl p-8">
            <div className="text-sm uppercase tracking-[0.3em] text-[color:var(--text-soft)]">
              Metodo de trabajo
            </div>
            <h2 className="mt-4 font-[var(--font-display)] text-3xl">
              De la ciencia al habito diario
            </h2>
            <p className="mt-4 text-[color:var(--text-soft)]">
              Nutricion basada en evidencia, con herramientas practicas para que
              el cambio se sienta posible y sostenible.
            </p>
          </div>
          <div className="grid gap-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="glass flex items-start gap-4 rounded-2xl p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-mist/40 text-sm">
                  0{index + 1}
                </div>
                <div>
                  <div className="text-lg font-semibold">{step.title}</div>
                  <div className="text-sm text-[color:var(--text-soft)]">
                    {step.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="futuro" className="px-6 pb-16 md:px-12">
        <div className="mx-auto max-w-6xl rounded-3xl border border-mist/30 bg-ink/60 p-8 md:p-12">
          <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-sm uppercase tracking-[0.3em] text-[color:var(--text-soft)]">
                Plataforma a futuro
              </div>
              <h2 className="mt-4 font-[var(--font-display)] text-3xl">
                Un espacio privado para tu progreso
              </h2>
              <p className="mt-4 text-[color:var(--text-soft)]">
                Estamos preparando una plataforma para que cada paciente pueda
                registrar sus datos, ver graficas y recibir ajustes en tiempo
                real.
              </p>
            </div>
            <div className="grid gap-3">
              {expectations.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-glow" />
                  <span className="text-sm text-[color:var(--text-soft)]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="px-6 pb-20 md:px-12">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <div className="text-sm uppercase tracking-[0.3em] text-[color:var(--text-soft)]">
              Contacto
            </div>
            <h2 className="font-[var(--font-display)] text-3xl md:text-4xl">
              Agenda tu consulta y comienza hoy
            </h2>
            <p className="text-[color:var(--text-soft)]">
              Comparte tu objetivo y te enviaremos una propuesta personalizada
              con horarios disponibles.
            </p>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="space-y-4 text-sm text-[color:var(--text-soft)]">
              <div>
                <div className="text-xs uppercase tracking-[0.3em]">Correo</div>
                <div className="mt-2 text-lg text-white">contacto@alahynutrition.com</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.3em]">Telefono</div>
                <div className="mt-2 text-lg text-white">81 1328 2818</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.3em]">Ubicacion</div>
                <div className="mt-2 text-lg text-white">Consultas en linea y presenciales</div>
              </div>
            </div>
            <button className="mt-6 w-full rounded-2xl bg-glow px-4 py-3 text-sm font-semibold text-ink shadow-glow">
              Solicitar informacion
            </button>
          </div>
        </div>
      </section>

      <footer className="px-6 pb-10 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-mist/20 pt-6 text-xs text-[color:var(--text-soft)]">
          <div>Alahy Nutrition</div>
          <div>Erick David Alahy Rios Cervantes</div>
          <div>Nutricion personalizada</div>
        </div>
      </footer>
    </main>
  );
}
