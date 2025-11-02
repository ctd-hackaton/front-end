import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from "../css/dashboard/WeeklyStats.module.css";

function WeeklyStats({ weekPlan }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!weekPlan || !svgRef.current) return;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const calculateDayStats = (dayMeals) => {
      if (!dayMeals || typeof dayMeals !== 'object') {
        return { calories: 0, carbs: 0, fats: 0, protein: 0 };
      }

      let calories = 0;
      let carbs = 0;
      let fats = 0;
      let protein = 0;

      Object.values(dayMeals).forEach((mealData) => {
        if (mealData?.nutrition) {
          calories += mealData.nutrition.calories || 0;
          carbs += mealData.nutrition.carbs || 0;
          fats += mealData.nutrition.fats || 0;
          protein += mealData.nutrition.protein || 0;
        }
      });

      return { calories, carbs, fats, protein };
    };

    const data = daysOfWeek.map(day => {
      const dayKey = Object.keys(weekPlan).find(key => 
        key.toLowerCase() === day.toLowerCase()
      );
      const dayMeals = dayKey ? weekPlan[dayKey] : null;
      const stats = calculateDayStats(dayMeals);
      return { day: day.substring(0, 3), ...stats };
    });

    d3.select(svgRef.current).selectAll("*").remove();

    const container = d3.select(containerRef.current);
    const containerWidth = container.node()?.getBoundingClientRect().width || 800;
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand()
      .domain(daysOfWeek.map(d => d.substring(0, 3)))
      .rangeRound([0, width])
      .paddingInner(0.2)
      .paddingOuter(0.1);

    const x1 = d3.scaleBand()
      .domain(['calories', 'carbs', 'fats', 'protein'])
      .rangeRound([0, x0.bandwidth()])
      .padding(0.1);

    const maxCalories = d3.max(data, d => d.calories) || 2000;
    const maxCarbs = d3.max(data, d => d.carbs) || 200;
    const maxFats = d3.max(data, d => d.fats) || 100;
    const maxProtein = d3.max(data, d => d.protein) || 100;

    const yCalories = d3.scaleLinear()
      .domain([0, maxCalories])
      .rangeRound([height, 0]);

    const yCarbs = d3.scaleLinear()
      .domain([0, maxCarbs])
      .rangeRound([height, 0]);

    const yFats = d3.scaleLinear()
      .domain([0, maxFats])
      .rangeRound([height, 0]);

    const yProtein = d3.scaleLinear()
      .domain([0, maxProtein])
      .rangeRound([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(['calories', 'carbs', 'fats', 'protein'])
      .range(['#10b981', '#0ea5e9', '#f59e0b', '#ef4444']);

    const yAxisCalories = d3.axisLeft(yCalories)
      .ticks(5)
      .tickFormat(d => d);

    g.append("g")
      .attr("class", "axis")
      .call(yAxisCalories)
      .append("text")
      .attr("fill", "#e6eef6")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Calories");

    const xAxis = d3.axisBottom(x0);

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#e6eef6");

    const dayGroups = g.selectAll(".day-group")
      .data(data)
      .enter().append("g")
      .attr("class", "day-group")
      .attr("transform", d => `translate(${x0(d.day)},0)`);

    const metrics = [
      { key: 'calories', scale: yCalories, height: height },
      { key: 'carbs', scale: yCarbs, height: height },
      { key: 'fats', scale: yFats, height: height },
      { key: 'protein', scale: yProtein, height: height }
    ];

    metrics.forEach((metric) => {
      dayGroups.append("rect")
        .attr("x", x1(metric.key))
        .attr("y", d => metric.scale(d[metric.key]))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - metric.scale(d[metric.key]))
        .attr("fill", color(metric.key))
        .attr("opacity", 0.8);
    });

    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 150}, 20)`);

    const legendItems = ['calories', 'carbs', 'fats', 'protein'];
    const legendLabels = ['Calories', 'Carbs', 'Fats', 'Protein'];

    legendItems.forEach((item, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(item));

      legendRow.append("text")
        .attr("x", 16)
        .attr("y", 10)
        .attr("fill", "#e6eef6")
        .style("font-size", "12px")
        .text(legendLabels[i]);
    });

    g.selectAll(".axis line, .axis path")
      .attr("stroke", "#6b7280")
      .attr("stroke-width", 1);

    g.selectAll(".axis text")
      .attr("fill", "#9ca3af")
      .style("font-size", "11px");

  }, [weekPlan]);

  if (!weekPlan) {
    return (
      <div className={styles.container}>
        <p className={styles.noData}>No statistics available for this week</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Weekly Stats</h2>
      <div ref={containerRef} className={styles.chartContainer}>
        <svg ref={svgRef} className={styles.chart}></svg>
      </div>
    </div>
  );
}

export default WeeklyStats;

