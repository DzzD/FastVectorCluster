import { FastVectorCluster } from "./FastVectorCluster.js";

const maxVector = 700;
const dimensionCount = 2000;
const fasterVectorCluster = new FastVectorCluster(maxVector, dimensionCount);

/* min/max value for vector components, random value */
function randomValue()
{
    return (Math.random() * 200) - 100;
}

//Generate all vectors and add it to clusteriser
const pushStart = performance.now();
for (let vectorIndex = 0; vectorIndex < maxVector; vectorIndex += 1)
{
    const vector = new Float32Array(dimensionCount);
    for (let dimensionIndex = 0; dimensionIndex < dimensionCount; dimensionIndex += 1)
    {
        vector[dimensionIndex] = randomValue();
    }
    fasterVectorCluster.push(vector);
}
const pushEnd = performance.now();

//Normalize vectors
const normalizeStart = performance.now();
fasterVectorCluster.normalize();
const normalizeEnd = performance.now();

//Pre-compute distances
const distanceStart = performance.now();
fasterVectorCluster.computeDistance();
const distanceEnd = performance.now();

//Clusterize using choosen percentile
const clusterizeThreshold = fasterVectorCluster.getDistancePercentile(0.9);
const clusterizeStart = performance.now();
const clusters = fasterVectorCluster.clusterizeStrict(clusterizeThreshold);
const clusterizeEnd = performance.now();

const formatDuration = (start, end) =>
{
    return `${(end - start).toFixed(2)}ms`;
};

console.log("=== FastVectorCluster Benchmark ===");
console.log(`Vectors pushed: ${maxVector}`);
console.log(`Dimensions per vector: ${dimensionCount}`);
console.log(`Clusterize threshold (median): ${clusterizeThreshold}`);
console.log(`Push time: ${formatDuration(pushStart, pushEnd)}`);
console.log(`Normalize time: ${formatDuration(normalizeStart, normalizeEnd)}`);
console.log(`Distance time: ${formatDuration(distanceStart, distanceEnd)}`);
console.log(`Clusterize time: ${formatDuration(clusterizeStart, clusterizeEnd)}`);
console.log(`Threshold: ${clusterizeThreshold}`);
console.log(`Distance average: ${fasterVectorCluster.distanceAverage}`);
console.log(`Distance median: ${fasterVectorCluster.distanceMedian}`);
console.log(`Distance min: ${fasterVectorCluster.distanceMin}`);
console.log(`Distance max: ${fasterVectorCluster.distanceMax}`);
console.log(`Clusters found: ${clusters.length}`);
clusters.forEach((cluster, index) =>
{
    console.log(`cluster${index + 1} = {${cluster.join("},{")}}`);
});
