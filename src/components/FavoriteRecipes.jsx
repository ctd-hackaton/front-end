import styles from '../css/home/FavoriteRecipes.module.css';
import { Heart } from 'lucide-react';

const FavoriteRecipes = ({ 
  title = "Featured Recipes",
  image1 = {
    src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
    alt: "Delicious salad",
    title: "Fresh Garden Salad",
    description: "Healthy & Nutritious"
  },
  image2 = {
    src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
    alt: "Pasta dish",
    title: "Creamy Pasta",
    description: "Comfort Food"
  }
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
      <Heart  size={24} color="#ef4444" fill="none" />&nbsp;
        <h2 className={styles.title}>{title}</h2>
      </div>
      
      <div className={styles.imagesContainer}>
        <div className={styles.imageCard}>
          <div className={styles.imageWrapper}>
            <img 
              src={image1.src} 
              alt={image1.alt}
              className={styles.image}
            />
          </div>
          <div className={styles.imageInfo}>
            <h3 className={styles.imageTitle}>{image1.title}</h3>
            <p className={styles.imageDescription}>{image1.description}</p>
          </div>
        </div>

        <div className={styles.imageCard}>
          <div className={styles.imageWrapper}>
            <img 
              src={image2.src} 
              alt={image2.alt}
              className={styles.image}
            />
          </div>
          <div className={styles.imageInfo}>
            <h3 className={styles.imageTitle}>{image2.title}</h3>
            <p className={styles.imageDescription}>{image2.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoriteRecipes;