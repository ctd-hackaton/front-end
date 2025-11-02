import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const data = [
  { name: 'Chicken', count: 12 },
  { name: 'Rice', count: 10 },
  { name: 'Broccoli', count: 9 },
  { name: 'Salmon', count: 8 },
  { name: 'Eggs', count: 7 },
  { name: 'Avocado', count: 6 },
];

export function IngredientsChart() {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 80 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)])
      .nice()
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, height])
      .padding(0.2);

    const colorScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range(['#10b981', '#646cff'])
      .interpolate(d3.interpolateRgb);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisBottom(x).tickSize(height).tickFormat(''));

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => y(d.name))
      .attr('width', d => x(d.count))
      .attr('height', y.bandwidth())
      .attr('rx', 6)
      .attr('fill', (d, i) => colorScale(i))
      .on('mouseover', (event, d) => {
        tooltip.html(`
          <div class="tooltip-title">${d.name}</div>
          <div class="tooltip-item">${d.count} times this week</div>
        `)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 10}px`)
        .classed('visible', true);
      })
      .on('mouseout', () => {
        tooltip.classed('visible', false);
      });

  }, []);

  return (
    <div className="chart-card">
      <h3 className="chart-title">Top Ingredients</h3>
      <p className="chart-subtitle">Most used this week</p>
      <svg ref={svgRef} className="chart"></svg>
      <div ref={tooltipRef} className="tooltip"></div>
    </div>
  );
}
