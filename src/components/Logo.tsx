import Image from 'next/image'

interface LogoProps {
 className?: string
 width?: number
 height?: number
}

export function Logo({ className = '', width = 120, height = 40 }: LogoProps) {
 return (
 <div className={`relative flex items-center ${className}`}>
 <Image
 src="/logo.png"
 alt="VEIA Logo"
 width={width}
 height={height}
 className="object-contain"
 priority
 />
 </div>
 )
}
