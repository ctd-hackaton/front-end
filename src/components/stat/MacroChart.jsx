import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const data = [
  { name: 'Protein', value: 142, color: '#10b981' },
  { name: 'Carbs', value: 235, color: '#34d399' },
  { name: 'Fats', value: 65, color: '#646cff' },
];

export function MacroChart() {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const radius = Math.min(width, height) / 2 - 20;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', 'var(--surface)')
      .attr('stroke-width', 2)
      .attr('class', 'bar')
      .on('mouseover', (event, d) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percent = ((d.data.value / total) * 100).toFixed(0);
        
        tooltip.html(`
          <div class="tooltip-title">${d.data.name}</div>
          <div class="tooltip-item">${d.data.value}g (${percent}%)</div>
        `)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 10}px`)
        .classed('visible', true);
      })
      .on('mouseout', () => {
        tooltip.classed('visible', false);
      });

    // Center text
    const total = data.reduce((sum, item) => sum + item.value, 0);
    g.append('text')
      .attr('class', 'donut-value')
      .attr('y', -5)
      .text(total);

    g.append('text')
      .attr('class', 'donut-label')
      .attr('y', 15)
      .text('grams');

  }, []);

  return (
    <div className="chart-card">
      <h3 className="chart-title">Macros</h3>
      <p className="chart-subtitle">Daily average</p>
      <svg ref={svgRef} className="chart"></svg>
      <div className="legend">
        {data.map(item => (
          <div key={item.name} className="legend-item">
            <div className="legend-color" style={{ background: item.color }}></div>
            <span className="legend-label">{item.name}</span>
          </div>
        ))}
      </div>
      <div ref={tooltipRef} className="tooltip"></div>
    </div>
  );
}
