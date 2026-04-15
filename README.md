FastVectorCluster
=================

FastVectorCluster is a lightweight JavaScript utility for storing large sets of n-dimensional vectors in contiguous `Float32Array` buffers. It supports normalized vector storage, pairwise cosine distance computation (`1 - dot` on normalized vectors), distance percentile extraction, connectivity-based clustering, and a stricter greedy clustering mode where a vector can join a cluster only if it stays within the threshold of every member already in that cluster.

Key Features
 

* **Inline storage**: All vectors live inside a single flattened `Float32Array`, minimizing allocations and improving cache locality.
* **Automatic normalization**: Each vector is normalized at insertion, and a bulk `normalize()` method remains available for reprocessing existing data.
* **Pairwise distance matrix**: `computeDistance()` computes pairwise cosine distances (`1 - dot`) between normalized vectors, stores them in a row-major `Float32Array`, and keeps summary statistics (average, median, min, max).
* **Distance percentile extraction**: `getDistancePercentile(percentile)` reads directly from the computed distance matrix and returns thresholds such as the 25th percentile, median, or 75th percentile.
* **Connectivity-based clustering**: `clusterize(threshold)` groups vectors by thresholded connectivity, meaning vectors may end up in the same cluster through chains of nearby neighbors.
* **Strict greedy clustering**: `clusterizeStrict(threshold)` adds a vector to a cluster only if it is within the threshold of every member already present in that cluster.

Performance
- 

In a simple benchmark on an average computer, processing **700 vectors of 2000 dimensions** took about **3000 ms** with this initial raw, non-optimized version.

Actual performance may vary depending on hardware and runtime conditions.

Usage Overview
- 

```bash
node index.js
```

The script generates random vectors, pushes them into `FastVectorCluster`, computes the distance matrix, prints the results, and runs clustering using a chosen threshold such as the median distance or a percentile.

Quick Example
 

```js
import { FastVectorCluster } from "./FastVectorCluster.js";

const cluster = new FastVectorCluster(4, 3);

cluster.push(new Float32Array([1, 0, 0]));
cluster.push(new Float32Array([0, 1, 0]));
cluster.push(new Float32Array([0.5, 0.5, 0]));
cluster.push(new Float32Array([-1, 0, 0]));

cluster.computeDistance();

const median = cluster.distanceMedian;
const q1 = cluster.getDistancePercentile(0.25);

const clusters = cluster.clusterize(median);
const strictClusters = cluster.clusterizeStrict(q1);

console.log(clusters);
console.log(strictClusters);
```

License
- 

MIT License.

Author
 

Bruno Augier (aka DzzD).