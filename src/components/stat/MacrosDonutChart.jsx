import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from "../../css/Statistics.module.css";

export function MacrosDonutChart({ protein, carbs, fats }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || protein === undefined || carbs === undefined || fats === undefined) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const total = protein + carbs + fats;
    const totalCalories = (protein * 4) + (carbs * 4) + (fats * 9);

    if (total === 0) return;

    const data = [
      { 
        name: 'Protein', 
        value: protein, 
        percentage: ((protein / total) * 100).toFixed(0),
        color: 'var(--color-primary)',
        calories: protein * 4
      },
      { 
        name: 'Carbs', 
        value: carbs, 
        percentage: ((carbs / total) * 100).toFixed(0),
        color: 'var(--color-secondary)',
        calories: carbs * 4
      },
      { 
        name: 'Fats', 
        value: fats, 
        percentage: ((fats / total) * 100).toFixed(0),
        color: 'var(--color-accent)',
        calories: fats * 9
      },
    ];

    // Dimensions
    const width = svgRef.current.clientWidth;
    const height = 280;
    const radius = Math.min(width, height) / 2 - 10;
    const innerRadius = radius * 0.65;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Create pie generator
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null)
      .padAngle(0.03);

    // Create arc generator
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    const arcHover = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius + 5);

    // Get computed CSS colors
    const getColor = (cssVar) => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(cssVar).trim();
    };

    // Tooltip group (SVG-based)
    const tooltipGroup = svg.append('g')
      .attr('class', 'tooltip-group')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    const tooltipBg = tooltipGroup.append('rect')
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', getColor('--surface-dark') || '#1a1a1a')
      .attr('stroke', getColor('--primary-green') || '#10b981')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))');

    const tooltipName = tooltipGroup.append('text')
      .attr('class', 'tooltip-name')
      .style('fill', getColor('--text-primary') || '#ffffff')
      .style('font-weight', '600')
      .style('font-size', '14px');

    const tooltipValue = tooltipGroup.append('text')
      .attr('class', 'tooltip-value')
      .style('fill', getColor('--primary-green') || '#10b981')
      .style('font-size', '14px');

    // Draw arcs
    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => getColor(d.data.color) || d.data.color)
      .attr('class', styles.macroArc)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        // Enlarge arc
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover);

        // Update tooltip content
        tooltipName.text(d.data.name);
        tooltipValue.text(`${d.data.value}g (${d.data.percentage}%)`);

        // Position text elements
        tooltipName.attr('x', 12).attr('y', 22);
        tooltipValue.attr('x', 12).attr('y', 42);

        // Calculate tooltip size
        const tooltipWidth = 180;
        const tooltipHeight = 55;

        // Position tooltip
        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        let tooltipX = mouseX + 10;
        let tooltipY = mouseY - tooltipHeight / 2;

        // Keep tooltip in bounds
        if (tooltipX + tooltipWidth > width) {
          tooltipX = mouseX - tooltipWidth - 10;
        }
        if (tooltipY < 0) tooltipY = 10;
        if (tooltipY + tooltipHeight > height) tooltipY = height - tooltipHeight - 10;

        // Update background
        tooltipBg
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', tooltipWidth)
          .attr('height', tooltipHeight);

        // Show tooltip
        tooltipGroup
          .attr('transform', `translate(${tooltipX},${tooltipY})`)
          .transition()
          .duration(200)
          .style('opacity', 1);
      })
      .on('mouseout', function() {
        // Return arc to normal size
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc);

        // Hide tooltip
        tooltipGroup
          .transition()
          .duration(200)
          .style('opacity', 0);
      });

    // Center text
    const centerGroup = g.append('g')
      .attr('class', 'center-text');

    centerGroup.append('text')
      .attr('class', styles['donut-value'])
      .attr('y', -5)
      .style('fill', getColor('--text-primary') || '#ffffff')
      .style('font-size', '2rem')
      .style('font-weight', '600')
      .style('text-anchor', 'middle')
      .text(totalCalories.toFixed(0));

    centerGroup.append('text')
      .attr('class', styles['donut-label'])
      .attr('y', 20)
      .style('fill', getColor('--text-muted') || '#9ca3af')
      .style('font-size', '0.875rem')
      .style('text-anchor', 'middle')
      .text('kcal/day');

  }, [protein, carbs, fats]);

  const total = protein + carbs + fats;
  const data = [
    { 
      name: 'Protein', 
      value: protein, 
      percentage: total > 0 ? ((protein / total) * 100).toFixed(0) : 0,
      color: 'var(--color-primary)'
    },
    { 
      name: 'Carbs', 
      value: carbs, 
      percentage: total > 0 ? ((carbs / total) * 100).toFixed(0) : 0,
      color: 'var(--color-secondary)'
    },
    { 
      name: 'Fats', 
      value: fats, 
      percentage: total > 0 ? ((fats / total) * 100).toFixed(0) : 0,
      color: 'var(--color-accent)'
    },
  ];

  return (
    <div className={styles['chart-card']} ref={containerRef}>
      <div>
        <h3 className={styles['chart-title']}>
          Macronutrient Breakdown
        </h3>
        <p className={styles['chart-subtitle']}>
          Daily average distribution
        </p>
      </div>
      
      <div style={{ position: 'relative' }}>
        <svg 
          ref={svgRef} 
          className={styles.chart}
          style={{ width: '100%', height: '280px' }}
        />
      </div>
      
      {/* Legend */}
      <div className={styles['macro-legend']}>
        {data.map((item) => (
          <div key={item.name} className={styles['macro-legend-item']}>
            <div className={styles['macro-legend-header']}>
              <div 
                className={styles['macro-legend-dot']}
                style={{ backgroundColor: item.color }}
              />
              <span className={styles['macro-legend-name']}>
                {item.name}
              </span>
            </div>
            <div className={styles['macro-legend-value']}>
              {item.value}g
            </div>
            <div className={styles['macro-legend-percentage']}>
              {item.percentage}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}