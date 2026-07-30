export default function AstralisLogo({ className = 'h-8 w-8' }: { className?: string }) {
  return <img src="/astralis-logo.png" alt="Astralis" className={`object-contain ${className}`} />
}
