const sel = $('#cy');
sel.width($(window).width());
sel.height($(window).height() - 100);

let cur = 1;
let nodes = [null, null]
let goal_edges = []
let visited;

const cy = cytoscape({

    container: document.getElementById('cy'), // container to render in

    elements: [ // list of graph elements to start with
        { // node a
            data: { id: '0' }
        },
        { // node b
            data: { id: '1' }
        },
        { // edge ab
            data: { id: 'c01', source: '0', target: '1' }
        },
    ],

    style: [ // the stylesheet for the graph
        {
            selector: 'node',
            style: {
                'background-color': '#666',
                'label': 'data(id)'
            }
        },

        {
            selector: 'edge',
            style: {
                'width': 3,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
            }
        }
    ],

    layout: {
        name: 'grid',
        rows: 1
    }
});

$('#deselect').click(() => {
    for (let i = 0; i < cur+1; i++) {
        cy.$(`#${i}`).style('background-color','#666')
    }
    nodes = [null, null]
})

$('#add').click(() => {
    cy.add({
        group: 'nodes',
        data: {id: cur++},
        position: { x: $(window).width()/2-200 + Math.random()*200, y: $(window).height()/2-200 + Math.random()*200 },
        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    'background-color': '#666',
                    'label': 'data(id)'
                }
            },
        ],

        layout: {
            name: 'grid',
            rows: 1
        }
    })
})

$('#remove').click(() => {
    try {
        cy.remove(cy.$(`#${nodes[0].id()}`))
    } catch (e) {
        // pass
    }

    for (let i = 0; i < nodes.length; i++) {
        nodes[i].style('background-color', '#666')
    }
    nodes = [];
})

$('#connect').click(() => {
    cy.add({
        data: { id: `c${nodes[1].id() + '' + nodes[0].id()}`, source: `${nodes[1].id()}`, target: `${nodes[0].id()}` },
    })
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].style('background-color', '#666')
    }
    nodes = [];
})

$('#disconnect').click(() => {
    try {
        cy.remove(cy.$(`#c${nodes[1].id() + '' + nodes[0].id()}`))
    } catch (e) {
        // pass
    }
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].style('background-color', '#666')
    }
    nodes = [];
})

$('#dfs').click(() => {
    goal_edges = []
    if (nodes[0] !== null && nodes[1] !== null) {
        visited = new Array(cur+1);
    }

    dfs(nodes[1].id(), nodes[0].id(), []);
    setTimeout(()=>{
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].style('background-color', '#666')
        }
        for (let i = 0; i < goal_edges.length; i++) {
            cy.$(`#${goal_edges[i]}`).style('line-color', '#ccc')
        }
        for (let i = 0; i < visited.length; i++) {
            cy.$(`#${visited[i]}`).style('background-color', '#666')
        }
        nodes = [];
        found = false;
    }, 3000)
})

$('#bfs').click(() => {
    if (nodes[0] !== null && nodes[1] !== null) {
        visited = new Array(cur+1);
    }

    let stopped = false
    const node = nodes[1].id();
    const goal = nodes[0].id();
    goal_edges = [];
    let poppedBy = {};

    let set = new Set();
    let q = [node]; // why does js not have a queue :(
    while (q.length > 0 && !stopped) {
        let cur = q.pop();
        if (cur === goal) {
            stopped = true;
            console.log("found")

            //
            // trace bfs path
            //

            let path = [goal];

            let cur_path = goal;
            while (cur_path !== node) {
                cur_path = poppedBy[cur_path];
                path.unshift(cur_path)
            }

            for (let i = 0; i < path.length-1; i++) {
                goal_edges[i] = 'c' + '' + path[i] + '' + path[i+1];
                cy.$(`#${path[i]}`).style('background-color', 'yellow');
                cy.$(`#${goal_edges[i]}`).style('line-color', '#f00');
            }
            cy.$(`#${path[path.length-1]}`).style('background-color', 'yellow');

        }

        let cur_edges = cy.$(`#${cur}`).connectedEdges();
        for (let i = 0; i < cur_edges.length; i++) {
            let n = cur_edges[i].target().id();
            if (!set.has(n)) {
                set.add(n);
                q.push(n);
                poppedBy[n]=cur;
            }
        }
    }

    // after bfs finishes

    setTimeout(()=>{
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].style('background-color', '#666')
        }
        for (let i = 0; i < goal_edges.length; i++) {
            cy.$(`#${goal_edges[i]}`).style('line-color', '#ccc')
        }
        set.forEach(element => {
            cy.$(`#${element}`).style('background-color', '#666')
        })

        nodes = [];
        found = false;
    }, 3000)
})

cy.on('tap', 'node', function(evt){
    const node = evt.target;
    if (!nodes.includes(node)) {
        node.style('background-color', 'magenta')

        try {
            nodes[1].style('background-color', '#666')
        } catch (e) {
            // pass
        }

        nodes[1] = nodes[0];
        nodes[0] = node;
    }
});


let found = false // for dfs

function dfs(node, goal, edges) {
    if (!found) {
        if (node === goal) {
            for (let i = 0; i < edges.length; i++) {
                goal_edges.push(edges[i])
                cy.$(`#${edges[i]}`).style('line-color', '#f00')
            }
            found = true;
        }

        // https://stackoverflow.com/questions/8922060/how-to-trace-the-path-in-a-breadth-first-search
        // highlight the path

        cy.$(`#${node}`).style('background-color', 'yellow')
        visited.push(node)

        let cur_edges = cy.$(`#${node}`).connectedEdges();
        for (let i = 0; i < cur_edges.length; i++) {
            let cur = cur_edges[i].target().id();
            if (!visited.includes(cur)) {
                dfs(cur, goal, edges.concat(cur_edges[i].id()));
                if (!found)
                    cy.$(`#${cur}`).style('background-color', '#666')
            }
        }
    }
    if (!found) {
        cy.$(`#${node}`).style('background-color','#666')
    }
}