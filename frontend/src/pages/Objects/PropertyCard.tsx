import styles from "./Objects.module.css";

type Item = {
  id: number | string;
  title?: string;
  address?: string;
  price?: number;
  cover_url?: string | null;
};

export default function PropertyCard({ item }: { item: Item }) {
  return (
    <article className={styles.card}>
      <div className={styles.thumb}>
        {item.cover_url ? (
          <img src={item.cover_url} alt={item.title || "Фото объекта"} />
        ) : (
          <div className={styles.thumbStub} />
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{item.title || "Объект"}</div>
        <div className={styles.cardMeta}>
          {item.address && <span>{item.address}</span>}
          {item.price != null && (
            <span>{Intl.NumberFormat("ru-RU").format(item.price)} ₽</span>
          )}
        </div>
      </div>
    </article>
  );
}
