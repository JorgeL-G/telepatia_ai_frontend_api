import Chat from '../components/chat/Chat';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          Bienvenido a <span className={styles.highlight}>Telepatía AI</span>
        </h1>
        <p className={styles.description}>
          Tu aplicación Next.js está lista para comenzar
        </p>
        <Chat />
      </div>
    </main>
  );
}
