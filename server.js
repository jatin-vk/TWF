const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const productToCenter = {
  "A": "C1", "B": "C1", "C": "C1",
  "D": "C2", "E": "C2", "F": "C2",
  "G": "C3", "H": "C3", "I": "C3"
};

const productWeights = {
  "A": 3, "B": 2, "C": 8,
  "D": 12, "E": 25, "F": 15,
  "G": 0.5, "H": 1, "I": 2
};

const distances = {
  "C1": { "C2": 4, "C3": 7, "L1": 3 },
  "C2": { "C1": 4, "C3": 3, "L1": 2.5 },
  "C3": { "C1": 7, "C2": 3, "L1": 2 },
  "L1": { "C1": 3, "C2": 2.5, "C3": 2 }
};

function getCostPerKm(weight) {
  return weight <= 5 ? 10 : 10 + 8 * Math.ceil((weight - 5) / 5);
}

function getPermutations(arr) {
  if (arr.length === 0) return [[]];
  const result = [];
  arr.forEach((val, idx) => {
    const rest = [...arr.slice(0, idx), ...arr.slice(idx + 1)];
    const perms = getPermutations(rest);
    perms.forEach(p => result.push([val, ...p]));
  });
  return result;
}

function calculateRouteDistance(route) {
  let dist = 0;
  for (let i = 0; i < route.length - 1; i++) {
    dist += distances[route[i]][route[i + 1]];
  }
  return dist;
}

function calculateMinCost(order) {
  let centerWeightMap = {};

  // collect centers and weights
  for (let product in order) {
    if (productToCenter[product]) {
      const center = productToCenter[product];
      const weight = productWeights[product] * order[product];
      if (!centerWeightMap[center]) centerWeightMap[center] = 0;
      centerWeightMap[center] += weight;
    }
  }

  const centers = Object.keys(centerWeightMap);
  if (centers.length === 0) return { cost: 0, centersUsed: [] };

  const centerPermutations = getPermutations(centers);
  let minCost = Infinity;
  let bestRoute = [];

  centerPermutations.forEach(perm => {
    let totalCost = 0;
    let current = perm[0]; // start from first center
    let weightCarried = 0;

    // Go from start center to first delivery
    totalCost += distances[current]["L1"] * getCostPerKm(centerWeightMap[current]);

    for (let i = 1; i < perm.length; i++) {
      const next = perm[i];
      totalCost += distances["L1"][next] * getCostPerKm(0); // go to next center (empty)
      totalCost += distances[next]["L1"] * getCostPerKm(centerWeightMap[next]); // deliver
    }

    if (totalCost < minCost) {
      minCost = totalCost;
      bestRoute = perm;
    }
  });

  return { cost: Math.round(minCost), centersUsed: centers };
}

app.post("/calculate-cost", (req, res) => {
  const order = req.body;
  const result = calculateMinCost(order);
  res.json(result);
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
