import styles from "./hero.module.css";

interface HeroProps {
  title: string;
  subtitle?: string;
}

export default function Hero({ title, subtitle }: HeroProps) {
  return (
    <div className={styles.hero}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
