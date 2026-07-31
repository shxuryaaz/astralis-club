import { Link } from 'react-router-dom'
import AstralisBackground from '../components/AstralisBackground'
import AstralisLogo from '../components/AstralisLogo'

const members = [
  {
    name: 'Shaurya Singh',
    position: 'President',
    role: 'Founding Engineer @ Agilow',
    image: '/member-shaurya-singh.png?v=4',
  },
  {
    name: 'Naman Sharma',
    role: 'Technology and Digital Intern @ Protiviti',
    image: '/member-naman-sharma.png',
  },
  {
    name: 'Kosaraju Jethin',
    role: 'Co-Founder, Grenwall',
    image: '/member-kosaraju-jethin.png',
  },
]

export default function Members() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-black px-4 py-24 text-white sm:px-8">
      <AstralisBackground />
      <div className="pointer-events-none fixed inset-0 z-10 bg-black/60" />
      <div className="relative z-20 mx-auto max-w-6xl">
        <Link to="/" viewTransition aria-label="Astralis home">
          <AstralisLogo className="h-10 w-10" />
        </Link>
        <p className="mt-16 border-b border-white/10 pb-8 font-mono text-lg uppercase tracking-[0.22em] text-white/70 sm:text-xl">
          01 // Members
        </p>
        <div className="grid gap-px bg-white/10 sm:grid-cols-2 md:grid-cols-3">
          {members.map((member, index) => (
            <article key={member.name} className="group bg-black transition-colors hover:bg-[#222]">
              <div className="aspect-[4/5] overflow-hidden border-b border-white/10 bg-black">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.015]"
                />
              </div>
              <div className="p-5 sm:p-6">
                <p className="mb-8 font-mono text-[9px] tracking-[0.16em] text-white/40">
                  {String(index + 1).padStart(2, '0')} /
                </p>
                <h2 className="font-sans text-xl font-light text-white/90">{member.name}</h2>
                {'position' in member && (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/80">
                    {member.position}
                  </p>
                )}
                <p className="mt-3 font-mono text-[9px] uppercase leading-5 tracking-[0.12em] text-white/55">
                  {member.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
