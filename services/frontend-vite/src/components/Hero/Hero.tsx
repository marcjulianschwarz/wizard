interface HeroProps {
  title: string;
  subtitle?: string;
}

export default function Hero({ title, subtitle }: HeroProps) {
  return (
    <div className="">
      <h1 className="text-5xl font-bold text-center">{title}</h1>
      {subtitle && <p className="">{subtitle}</p>}
    </div>
  );
}
