import { useEffect, useRef } from "react";
import * as d3 from "d3";
import styles from "../../css/Statistics.module.css";

export function DailyCaloriesChart({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${svgRef.current.clientWidth} 300`);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.day))
      .range([0, width])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(2500, d3.max(data, (d) => d.calories) * 1.1)])
      .range([height, 0]);

    // Grid lines
    g.append("g")
      .attr("class", styles.grid)
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(""));

    // X Axis
    g.append("g")
      .attr("class", styles.axis)
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    // Y Axis
    g.append("g").attr("class", styles.axis).call(d3.axisLeft(yScale));

    // Target line
    const targetValue = data[0]?.target || 2000;
    g.append("line")
      .attr("class", styles["line-target"])
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yScale(targetValue))
      .attr("y2", yScale(targetValue));

    // Target label
    g.append("text")
      .attr("x", width - 5)
      .attr("y", yScale(targetValue) - 5)
      .attr("text-anchor", "end")
      .style("fill", "var(--text-muted)")
      .style("font-size", "12px")
      .text(`Target: ${targetValue} kcal`);

    // Gradient for area
    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "calorieGradient")
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "var(--primary-green)")
      .attr("stop-opacity", 0.3);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "var(--primary-green)")
      .attr("stop-opacity", 0);

    // Area generator
    const area = d3
      .area()
      .x((d, i) => xScale(d.day) + xScale.bandwidth() / 2)
      .y0(height)
      .y1((d) => yScale(d.calories))
      .curve(d3.curveMonotoneX);

    // Draw area
    g.append("path")
      .datum(data)
      .attr("fill", "url(#calorieGradient)")
      .attr("d", area);

    // Line generator
    const line = d3
      .line()
      .x((d, i) => xScale(d.day) + xScale.bandwidth() / 2)
      .y((d) => yScale(d.calories))
      .curve(d3.curveMonotoneX);

    // Draw line
    g.append("path")
      .datum(data)
      .attr("class", styles["line-main"])
      .attr("d", line);

    // Create tooltip group (hidden by default)
    const tooltipGroup = svg
      .append("g")
      .attr("class", "tooltip-group")
      .style("opacity", 0)
      .style("pointer-events", "none");

    // Tooltip background
    const tooltipBg = tooltipGroup
      .append("rect")
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", "var(--surface-dark)")
      .attr("stroke", "var(--primary-green)")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.3))");

    // Tooltip text elements
    const tooltipDay = tooltipGroup
      .append("text")
      .attr("class", "tooltip-day")
      .style("fill", "var(--text-primary)")
      .style("font-weight", "600")
      .style("font-size", "14px");

    const tooltipCalories = tooltipGroup
      .append("text")
      .attr("class", "tooltip-calories")
      .style("font-weight", "600")
      .style("font-size", "16px");

    const tooltipTarget = tooltipGroup
      .append("text")
      .attr("class", "tooltip-target")
      .style("fill", "var(--text-muted)")
      .style("font-size", "12px");

    // Dots
    g.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", styles.dot)
      .attr("cx", (d) => xScale(d.day) + xScale.bandwidth() / 2)
      .attr("cy", (d) => yScale(d.calories))
      .attr("r", 5)
      .on("mouseover", function (event, d) {
        const isOverTarget = d.calories > d.target;
        const cx = xScale(d.day) + xScale.bandwidth() / 2 + margin.left;
        const cy = yScale(d.calories) + margin.top;

        // Update tooltip content
        tooltipDay.text(d.day);
        tooltipCalories
          .text(`${d.calories} kcal`)
          .style(
            "fill",
            isOverTarget ? "var(--danger)" : "var(--primary-green)"
          );
        tooltipTarget.text(`Target: ${d.target} kcal`);

        // Position text elements
        tooltipDay.attr("x", 12).attr("y", 20);
        tooltipCalories.attr("x", 12).attr("y", 42);
        tooltipTarget.attr("x", 12).attr("y", 60);

        // Calculate tooltip size
        const padding = 12;
        const tooltipWidth = 150;
        const tooltipHeight = 70;

        // Position tooltip (adjust if near edges)
        let tooltipX = cx + 10;
        let tooltipY = cy - tooltipHeight / 2;

        // Keep tooltip in bounds
        if (tooltipX + tooltipWidth > svgRef.current.clientWidth) {
          tooltipX = cx - tooltipWidth - 10;
        }
        if (tooltipY < 0) tooltipY = 10;
        if (tooltipY + tooltipHeight > 300) tooltipY = 300 - tooltipHeight - 10;

        // Update background
        tooltipBg
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", tooltipWidth)
          .attr("height", tooltipHeight)
          .attr(
            "stroke",
            isOverTarget ? "var(--danger)" : "var(--primary-green)"
          );

        // Position and show tooltip
        tooltipGroup
          .attr("transform", `translate(${tooltipX},${tooltipY})`)
          .transition()
          .duration(200)
          .style("opacity", 1);

        // Enlarge dot
        d3.select(this).transition().duration(200).attr("r", 7);
      })
      .on("mouseout", function () {
        tooltipGroup.transition().duration(200).style("opacity", 0);

        d3.select(this).transition().duration(200).attr("r", 5);
      });
  }, [data]);

  return (
    <div className={styles["chart-card"]}>
      <div>
        <h3 className={styles["chart-title"]}>Daily Calorie Tracking</h3>
        <p className={styles["chart-subtitle"]}>
          Week overview with target comparison
        </p>
      </div>

      <svg
        ref={svgRef}
        className={styles.chart}
        style={{ width: "100%", height: "300px" }}
      />
    </div>
  );
}
