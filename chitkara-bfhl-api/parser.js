function processHierarchies(rawData) {
    const invalidEntries = [];
    const duplicateEdges = [];
    const duplicateTracker = {}; 
    const seenChildren = new Set();
    const adj = {};
    const allNodes = new Set();

    // 1. Validation & Edge Filtering
    rawData.forEach(entry => {
        if (typeof entry !== 'string') {
            invalidEntries.push(String(entry));
            return;
        }

        // Trim whitespace first, then validate 
        const trimmed = entry.trim();
        const match = trimmed.match(/^([A-Z])->([A-Z])$/); // Single uppercase letters 

        if (!match || trimmed.length !== 4) {
            invalidEntries.push(trimmed);
            return;
        }

        const parent = match[1];
        const child = match[2];

        // Self-loops are invalid 
        if (parent === child) {
            invalidEntries.push(trimmed);
            return;
        }

        const edgeStr = `${parent}->${child}`;

        // Duplicate edge handling [cite: 40-43]
        if (duplicateTracker[edgeStr]) {
            if (duplicateTracker[edgeStr] === 1) {
                duplicateEdges.push(edgeStr);
            }
            duplicateTracker[edgeStr]++;
            return;
        }
        duplicateTracker[edgeStr] = 1;

        // Multi-parent constraint: subsequent parent edges silently discarded 
        if (seenChildren.has(child)) {
            return;
        }
        seenChildren.add(child);

        // Build Adjacency List
        if (!adj[parent]) adj[parent] = [];
        if (!adj[child]) adj[child] = [];
        adj[parent].push(child);
        allNodes.add(parent);
        allNodes.add(child);
    });

    // 2. Grouping Components (Disjoint Set Union)
    const parentMap = {};
    allNodes.forEach(n => parentMap[n] = n);

    function findNode(i) {
        if (parentMap[i] === i) return i;
        return findNode(parentMap[i]);
    }
    
    function unionNodes(i, j) {
        const rootI = findNode(i);
        const rootJ = findNode(j);
        if (rootI !== rootJ) parentMap[rootI] = rootJ;
    }

    Object.keys(adj).forEach(p => {
        adj[p].forEach(c => unionNodes(p, c));
    });

    const groups = {};
    allNodes.forEach(n => {
        const root = findNode(n);
        if (!groups[root]) groups[root] = [];
        groups[root].push(n);
    });

    // 3. Process Trees & Cycles
    const hierarchies = [];
    let totalTrees = 0;
    let totalCycles = 0;
    let maxDepth = -1;
    let largestTreeRoot = "";

    Object.values(groups).forEach(component => {
        // Roots are nodes that never appear as a child [cite: 47]
        const validRoots = component.filter(n => !seenChildren.has(n));
        
        let rootNode;
        if (validRoots.length === 0) {
            // Pure cycle: use lexicographically smallest node [cite: 50]
            rootNode = component.sort()[0]; 
        } else {
            rootNode = validRoots.sort()[0];
        }

        // DFS for Cycle Detection 
        const visited = new Set();
        const recStack = new Set();
        let hasCycle = false;

        function detectCycle(node) {
            visited.add(node);
            recStack.add(node);
            const neighbors = adj[node] || [];
            for (let neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (detectCycle(neighbor)) return true;
                } else if (recStack.has(neighbor)) {
                    return true;
                }
            }
            recStack.delete(node);
            return false;
        }

        if (detectCycle(rootNode)) {
            hasCycle = true;
        }

        if (hasCycle) {
            totalCycles++; // [cite: 31]
            hierarchies.push({
                root: rootNode,
                tree: {}, // Empty tree for cycles [cite: 54]
                has_cycle: true // No depth field for cycles [cite: 55]
            });
        } else {
            totalTrees++; // [cite: 63]

            // Build Tree Object
            function buildTree(node) {
                const treeObj = {};
                const neighbors = adj[node] || [];
                neighbors.sort().forEach(n => {
                    const children = buildTree(n);
                    treeObj[n] = Object.keys(children).length > 0 ? children : {};
                });
                return treeObj;
            }

            // Depth calculation (nodes on longest path) [cite: 58-59]
            function getDepth(node) {
                const neighbors = adj[node] || [];
                if (neighbors.length === 0) return 1;
                let maxChildDepth = 0;
                neighbors.forEach(n => {
                    maxChildDepth = Math.max(maxChildDepth, getDepth(n));
                });
                return 1 + maxChildDepth;
            }

            const treeData = buildTree(rootNode);
            const depth = getDepth(rootNode);
            const treeOutput = { [rootNode]: Object.keys(treeData).length > 0 ? treeData : {} };

            hierarchies.push({
                root: rootNode,
                tree: treeOutput,
                depth: depth
            });

            // Largest Tree Root Tiebreaker Rules [cite: 62]
            if (depth > maxDepth) {
                maxDepth = depth;
                largestTreeRoot = rootNode;
            } else if (depth === maxDepth) {
                if (rootNode < largestTreeRoot) largestTreeRoot = rootNode;
            }
        }
    });

    return {
        hierarchies,
        "invalid entries": invalidEntries, // Key explicitly spaced as per requirements [cite: 14]
        duplicate_edges: duplicateEdges,   // [cite: 14]
        summary: {
            total_trees: totalTrees,       // [cite: 31]
            total_cycles: totalCycles,     // [cite: 31]
            largest_tree_root: largestTreeRoot
        }
    };
}

module.exports = { processHierarchies };