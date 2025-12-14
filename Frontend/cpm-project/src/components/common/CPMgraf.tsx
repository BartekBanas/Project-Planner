import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

type CPMDiagramProps = {
  receivedData: any;
};

const CPMDiagram: React.FC<CPMDiagramProps> = ({ receivedData }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const width = 1460;
  const height = 620;

  // defensive checks
  const events = receivedData?.events || [];
  const activities = receivedData?.activities || [];

  useEffect(() => {
    const nodes: any[] = [];
    const links: any[] = [];

    events.forEach((event: any) => {
      nodes.push({ id: event.id });
    });

    activities.forEach((activity: any) => {
      links.push({
        source: activity.sequence[0],
        target: activity.sequence[1],
        label: activity.taskName,
        duration: activity.duration,
        reserve: activity.timeReserve,
        earliestStart: activity.earlyStart,
        earliestFinish: activity.earlFinish,
        latestStart: activity.lateStart,
        latestFinish: activity.lateFinish,
        criticalPath: activity.critical,
      });
    });

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-1000))
      .force('center', d3.forceCenter(width / 2, height / 2));

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = d.x;
      d.fy = d.y;
    }

    const svg = d3.select(svgRef.current as any)
      .attr('width', width)
      .attr('height', height);

    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', function (d: any) {
        return d.criticalPath === true ? 'red' : 'black';
      })
      .attr('stroke-width', 2);

    const linkText = svg.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .style('font-size', '12px')
      .attr('text-anchor', 'top')
      .attr('alignment-baseline', 'middle')
      .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
      .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 20)
      .attr('fill', 'lightblue')
      .call(
        d3
          .drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    const labels = svg.selectAll('.labels')
      .data(nodes)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .text((d: any) => d.id)
      .style('font-size', '14px')
      .style('fill', 'black');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2)
        .text('').append('svg:tspan')
        .attr('dy', 5)
        .text((d: any) => {
          const label = d.label;
          const earliestStart = d.earliestStart;
          const earliestFinish = d.earliestFinish;
          return `${label} [${earliestStart}, ${earliestFinish}]`;
        })
        .append('svg:tspan')
        .attr('dx', -32)
        .attr('dy', 15)
        .text((d: any) => {
          const latestStart = d.latestStart;
          const latestFinish = d.latestFinish;

          return `[${latestStart}, ${latestFinish}]`;
        })
        .append('svg:tspan')
        .attr('dx', -50)
        .attr('dy', 15)
        .text((d: any) => {
          const reserve = d.reserve;
          return `rezerwa=${reserve}`;
        })
        .append('svg:tspan')
        .attr('dx', -40)
        .attr('dy', 20)
        .text((d: any) => {
          const duration = d.duration;
          return `${duration}`;
        });

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // cleanup on unmount
    return () => {
      svg.selectAll('*').remove();
      simulation.stop();
    };

  }, [events, activities]);

  return (
    <svg ref={svgRef}></svg>
  );
};

export default CPMDiagram;

