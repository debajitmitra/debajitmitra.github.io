function heatMap(){

    var svg = d3.selectAll('#node').attr('width',document.getElementById('nodeDiv').offsetWidth);
        //Using this selection to update the SVG everytime the function is called
    svg.selectAll("*").remove();

    removeElementsByClass('d3-tip n');
    

    var format = d3.format(",");

// Set tooltips
    var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                return "<strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" + "<strong>Confirmed: </strong><span class='details'>" + format(d.confirmed) +"<br></span>"
                + "<strong>Recovered: </strong><span class='details'>" + format(d.recovered) +"<br></span>" + "<strong>Deaths: </strong><span class='details'>" + format(d.deaths) +"<br></span>"
                + "<strong>Active: </strong><span class='details'>" + format(d.confirmed - d.recovered - d.deaths) +"<br></span>";
                })

    var margin = {top: 0, right: 0, bottom: 0, left: 10},s
                width = document.getElementById('nodeDiv').offsetWidth - margin.left - margin.right,
                height = document.getElementById('nodeDiv').offsetHeight - margin.top - margin.bottom;

    var color = d3.scaleThreshold()
        .domain([10000,100000,500000,1000000,5000000,10000000,50000000,100000000,500000000,1500000000])
        .range(["rgb(242, 254, 255)", "rgb(171, 196, 249)", "rgb(135, 169, 242)", "rgb(106, 149, 245)", "rgb(84, 142, 230)", "rgb(100, 127, 205)","rgb(67, 96, 180)","rgb(84, 73, 143)","rgb(80, 70, 107)","rgb(23, 26, 45)"]);

    var path = d3.geoPath();

    zoomed = ()=>{
        const {x,y,k} = d3.event.transform
        let t = d3.zoomIdentity
       t =  t.translate(x,y).scale(k).translate(50,50)
        svg.attr("transform", t)
      }
    var zoom = d3.zoom()
      .scaleExtent([1, 30])
      .on("zoom", zoomed);

    var svg = d3.select("#node")
                .attr("width", width)
                .attr("height", height)
                .call(zoom)
                .append('g')
                .attr('class', 'map')
                .append("g").attr('transform','translate(50,50)');


    var projection = d3.geoMercator()
                    .scale(0.03939*width + 0.104166*height+20)
                    .translate( [width/2.3, height / 1.85]);

    var path = d3.geoPath().projection(projection);

    svg.call(tip);

    queue()
        .defer(d3.json, "../world_countries.json")
        .defer(d3.tsv, "../world_covid.tsv")
        .await(ready);

    function ready(error, data, population) {

        console.log(data.features)

    var topology = topojson.topology(data.features);
    topology = topojson.presimplify(topology);

    var final_data_simplified = []
    for(i=0; i<data.features.length;i++){
        final_data_simplified.push(topojson.feature(topology,topology.objects[i]));
    }
    var populationById = {};

    population.forEach(function(d) { 
        
        populationById[d.id] = +d.confirmed;
        populationById[d.id+1] = +d.recovered;
        populationById[d.id+2] = +d.deaths;
    
    });
    final_data_simplified.forEach(function(d) { 
        
        d.confirmed = populationById[d.id] 
        d.recovered = populationById[d.id+1]
        d.deaths = populationById[d.id+2]    

    });

    svg.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(final_data_simplified)
        .enter().append("path")
        .attr("d", path)
        .style("fill", function(d) { return color(populationById[d.id]*100); })
        .style('stroke', 'white')
        .style('stroke-width', 0.5)
        .style("opacity",1)
        // tooltips
            .style("stroke","white")
            .style('stroke-width', 0.3)
            .on('mouseover',function(d){
            tip.show(d);

            d3.select(this)
                .style("opacity", 0.4)
                .style("stroke","white")
                .style("stroke-width",3);

            d3.select(this).style('cursor', 'pointer')
            })
            .on('click',function(d){
                tip.show(d);
    
                d3.select(this)
                    .style("opacity", 0.4)
                    .style("stroke","white")
                    .style("stroke-width",3)
                    .transition()
                    .duration(200)
                    .style('opacity', 0.8);

                    countrySpecificHist(d.properties.name);
                    lineGraph(d.properties.name);
                    latestCases(d.properties.name);


                    document.getElementById('resetButton').style.visibility = 'visible'



            })
            .on('mouseout', function(d){
            tip.hide(d);

            d3.select(this)
                .style("opacity", 1)
                .style("stroke","white")
                .style("stroke-width",0.3);
            });
    
    svg.append("path")
        .datum(topojson.mesh(final_data_simplified, function(a, b) { return a.id !== b.id; }))
        .attr("class", "names")
        .attr("d", path);
    }
}