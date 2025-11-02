import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const data = [
  { day: 'Mon', calories: 1950, target: 2100 },
  { day: 'Tue', calories: 2100, target: 2100 },
  { day: 'Wed', calories: 1850, target: 2100 },
  { day: 'Thu', calories: 2250, target: 2100 },
  { day: 'Fri', calories: 1900, target: 2100 },
  { day: 'Sat', calories: 2200, target: 2100 },
  { day: 'Sun', calories: 1950, target: 2100 },
];

export function WeeklyChart() {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.day))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.calories, d.target)) * 1.1])
      .nice()
      .range([height, 0]);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(''));

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // Target line
    g.append('line')
      .attr('class', 'line-target')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(2100))
      .attr('y2', y(2100));

    // Line
    const line = d3.line()
      .x(d => x(d.day) + x.bandwidth() / 2)
      .y(d => y(d.calories))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('class', 'line-main')
      .attr('d', line);

    // Dots
    g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.day) + x.bandwidth() / 2)
      .attr('cy', d => y(d.calories))
      .attr('r', 5)
      .on('mouseover', (event, d) => {
        tooltip.html(`
          <div class="tooltip-title">${d.day}</div>
          <div class="tooltip-item">${d.calories} kcal</div>
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
      <h3 className="chart-title">Weekly Calories</h3>
      <p className="chart-subtitle">Target: 2,100 kcal/day</p>
      <svg ref={svgRef} className="chart"></svg>
      <div ref={tooltipRef} className="tooltip"></div>
    </div>
  );
}
