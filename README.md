###FastVectorCluster


FastVectorCluster is a lightweight JavaScript utility for storing large sets of n-dimensional vectors in contiguous `Float32Array` buffers. It supports normalization, pairwise cosine-like distance computation (`1 - dot` on normalized vectors), connected-component clustering, and stricter complete-link clustering driven by distance thresholds.

## Key Features

* **Inline storage**: All vectors live inside a single flattened `Float32Array`, minimizing allocations and improving cache locality.
* **Automatic normalization**: Each vector is normalized at insertion, and a bulk `normalize()` method remains available for reprocessing existing data.
* **Pairwise distance matrix**: `computeDistance()` computes pairwise distances (`1 - dot`) between normalized vectors, stores them in a row-major `Float32Array`, and keeps summary statistics (average, median, min, max).
* **Connected-component clustering**: `clusterize(threshold)` groups vectors through thresholded connectivity.
* **Strict complete-link clustering**: `clusterizeStrict(threshold)` only merges groups when every pair across both groups stays within the threshold.

## Usage Overview

```bash
node index.js
```

## Performance

In a simple benchmark on an average computer, processing **700 vectors of 2000 dimensions** took about **3 ms** with this initial raw, non-optimized version. Actual performance may vary depending on hardware and runtime conditions.

The script generates random vectors, pushes them into `FastVectorCluster`, computes the distance matrix, prints the results, and runs clustering using a chosen threshold such as the median distance.


## Quick Example

```js
import { FastVectorCluster } from "./FastVectorCluster.js";

const cluster = new FastVectorCluster(4, 3);

cluster.push(new Float32Array([1, 0, 0]));
cluster.push(new Float32Array([0, 1, 0]));
cluster.push(new Float32Array([0.5, 0.5, 0]));
cluster.push(new Float32Array([-1, 0, 0]));

cluster.computeDistance();

const clusters = cluster.clusterize(cluster.distanceMedian);
// or
const strictClusters = cluster.clusterizeStrict(cluster.distanceMedian);

console.log(clusters);
console.log(strictClusters);
```

## License

MIT License.

## Author

Bruno Augier (aka DzzD).