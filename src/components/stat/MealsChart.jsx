import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const data = [
  { day: 'Mon', breakfast: 450, lunch: 650, dinner: 700, snack: 150 },
  { day: 'Tue', breakfast: 480, lunch: 700, dinner: 750, snack: 170 },
  { day: 'Wed', breakfast: 420, lunch: 620, dinner: 680, snack: 130 },
  { day: 'Thu', breakfast: 500, lunch: 750, dinner: 800, snack: 200 },
  { day: 'Fri', breakfast: 440, lunch: 640, dinner: 690, snack: 130 },
  { day: 'Sat', breakfast: 500, lunch: 730, dinner: 800, snack: 170 },
  { day: 'Sun', breakfast: 380, lunch: 560, dinner: 620, snack: 120 },
];

const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
const colors = {
  breakfast: '#10b981',
  lunch: '#34d399',
  dinner: '#646cff',
  snack: '#a78bfa',
};

export function MealsChart() {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 60, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand()
      .domain(data.map(d => d.day))
      .range([0, width])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain(meals)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, 900])
      .nice()
      .range([height, 0]);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(''));

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    const dayGroups = g.selectAll('.day-group')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${x0(d.day)},0)`);

    meals.forEach(meal => {
      dayGroups.selectAll(`.bar-${meal}`)
        .data(d => [d])
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', x1(meal))
        .attr('y', d => y(d[meal]))
        .attr('width', x1.bandwidth())
        .attr('height', d => height - y(d[meal]))
        .attr('rx', 4)
        .attr('fill', colors[meal])
        .on('mouseover', (event, d) => {
          tooltip.html(`
            <div class="tooltip-title">${d.day} - ${meal}</div>
            <div class="tooltip-item">${d[meal]} kcal</div>
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .classed('visible', true);
        })
        .on('mouseout', () => {
          tooltip.classed('visible', false);
        });
    });

  }, []);

  return (
    <>
      <h3 className="chart-title">Meal Breakdown</h3>
      <p className="chart-subtitle">Daily calories by meal type</p>
      <svg ref={svgRef} className="chart"></svg>
      <div className="legend">
        {meals.map(meal => (
          <div key={meal} className="legend-item">
            <div className="legend-color" style={{ background: colors[meal] }}></div>
            <span className="legend-label">{meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
          </div>
        ))}
      </div>
      <div ref={tooltipRef} className="tooltip"></div>
    </>
  );
}
