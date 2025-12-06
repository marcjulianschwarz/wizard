interface HeroProps {
  title: string;
  subtitle?: string;
}

export default function Hero({ title, subtitle }: HeroProps) {
  return (
    <div className="">
      <h1 className="text-4xl sm:text-5xl font-bold text-center">{title}</h1>
      {subtitle && <p className="text-center mt-2">{subtitle}</p>}
    </div>
  );
}
