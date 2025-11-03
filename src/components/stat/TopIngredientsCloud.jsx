import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from "../../css/Statistics.module.css";

export function TopIngredientsCloud({ ingredients }) {
  const cloudRef = useRef(null);

  useEffect(() => {
    if (!ingredients || ingredients.length === 0 || !cloudRef.current) return;

    // Полностью очищаем контейнер
    cloudRef.current.innerHTML = '';

    const maxCount = Math.max(...ingredients.map(i => i.count));

    const getFontSize = (count) => {
      const min = 10;
      const max = 28;
      return maxCount ? min + ((count / maxCount) * (max - min)) : min;
    };

    const getOpacity = (count) => maxCount ? 0.5 + ((count / maxCount) * 0.5) : 0.5;

    const container = d3.select(cloudRef.current);

    container.selectAll('div')
      .data(ingredients)
      .enter()
      .append('div')
      .attr('class', styles['ingredient-item'])
      .style('font-size', d => `${getFontSize(d.count)}px`)
      .style('opacity', d => getOpacity(d.count))
      .text(d => d.name)
      .append('div')
      .attr('class', styles['ingredient-tooltip'])
      .text(d => `Used ${d.count}x`);

    // Hover effects
    container.selectAll(`.${styles['ingredient-item']}`)
      .on('mouseenter', function() {
        d3.select(this).transition().duration(200).style('transform', 'scale(1.1)');
        d3.select(this).select(`.${styles['ingredient-tooltip']}`).style('opacity', '1');
      })
      .on('mouseleave', function() {
        d3.select(this).transition().duration(200).style('transform', 'scale(1)');
        d3.select(this).select(`.${styles['ingredient-tooltip']}`).style('opacity', '0');
      });

  }, [ingredients]);

  return (
    <div className={styles['ingredients-card']}>
      <div>
        <h3 className={styles['ingredients-title']}>Top Ingredients</h3>
        <p className={styles['ingredients-subtitle']}>Most frequently used this week</p>
      </div>
      <div ref={cloudRef} className={styles['ingredients-cloud']} />
    </div>
  );
}
