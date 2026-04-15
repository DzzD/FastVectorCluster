export class FastVectorCluster 
{
    constructor(maxVector, dimensionCount) 
    {
        this.maxVector = maxVector;
        this.dimensionCount = dimensionCount;
        this.vectorCount = 0;
        this.clear();
    }

    clear()
    {
        this.vectors = new Float32Array(this.maxVector * this.dimensionCount);
        this.distances = new Float32Array(this.maxVector * this.maxVector);
        this.distanceAverage = 0;
        this.distanceMedian = 0;
        this.distanceMin = 0;
        this.distanceMax = 0;
        this.clusters = [];
    }

    push(vector) 
    {
        const dimensionCount = this.dimensionCount;
        const offset = this.vectorCount * dimensionCount;
        let magnitudeSquared = 0;
        for (let index = 0; index < dimensionCount; index += 1)
        {
            const value = vector[index];
            magnitudeSquared += value * value;
        }
        const scale = magnitudeSquared === 0 ? 1 : 1 / Math.sqrt(magnitudeSquared);
        for (let index = 0; index < dimensionCount; index += 1)
        {
            this.vectors[offset + index] = vector[index] * scale;
        }
        this.vectorCount += 1;
    }

    normalize()
    {
        const dimensionCount = this.dimensionCount;
        for (let vectorIndex = 0; vectorIndex < this.vectorCount; vectorIndex += 1)
        {
            const vectorOffset = vectorIndex * dimensionCount;
            let magnitudeSquared = 0;
            for (let dimensionIndex = 0; dimensionIndex < dimensionCount; dimensionIndex += 1)
            {
                const value = this.vectors[vectorOffset + dimensionIndex];
                magnitudeSquared += value * value;
            }
            if (magnitudeSquared === 0)
            {
                continue;
            }
            const scale = 1 / Math.sqrt(magnitudeSquared);
            for (let dimensionIndex = 0; dimensionIndex < dimensionCount; dimensionIndex += 1)
            {
                this.vectors[vectorOffset + dimensionIndex] *= scale;
            }
        }
    }

    computeDistance()
    {
        const { vectors, distances, dimensionCount, vectorCount, maxVector } = this;
        const values = [];
        let sum = 0;
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < vectorCount; i += 1)
        {
            const offsetI = i * dimensionCount;
            for (let j = i; j < vectorCount; j += 1)
            {
                const offsetJ = j * dimensionCount;
                let dot = 0;
                for (let dimensionIndex = 0; dimensionIndex < dimensionCount; dimensionIndex += 1)
                {
                    dot += vectors[offsetI + dimensionIndex] * vectors[offsetJ + dimensionIndex];
                }
                const distance = Math.max( 0, 1 - dot);
                const indexIJ = i * maxVector + j;
                const indexJI = j * maxVector + i;
                distances[indexIJ] = distance;
                if (indexJI !== indexIJ)
                {
                    distances[indexJI] = distance;
                }
                values.push(distance);
                sum += distance;
                if (distance < min)
                {
                    min = distance;
                }
                if (distance > max)
                {
                    max = distance;
                }
            }
        }
        const count = values.length;
        if (count === 0)
        {
            this.distanceAverage = 0;
            this.distanceMedian = 0;
            this.distanceMin = 0;
            this.distanceMax = 0;
            return distances;
        }
        this.distanceAverage = sum / count;
        values.sort((a, b) => a - b);
        if (count % 2 === 1)
        {
            this.distanceMedian = values[(count - 1) / 2];
        }
        else
        {
            const mid = count / 2;
            this.distanceMedian = (values[mid - 1] + values[mid]) / 2;
        }
        this.distanceMin = min;
        this.distanceMax = max;
        return distances;
    }

    getDistancePercentile(percentile)
    {
        const { distances, vectorCount, maxVector } = this;
        const values = [];

        if (percentile <= 0)
        {
            percentile = 0;
        }
        else if (percentile >= 1)
        {
            percentile = 1;
        }

        for (let i = 0; i < vectorCount; i += 1)
        {
            const rowOffset = i * maxVector;
            for (let j = i + 1; j < vectorCount; j += 1)
            {
                const value = distances[rowOffset + j];
                if (value >= 0)
                {
                    values.push(value);
                }
            }
        }

        if (values.length === 0)
        {
            return 0;
        }

        values.sort((a, b) => a - b);

        const index = Math.floor((values.length - 1) * percentile);
        return values[index];
    }    

    clusterize(threshold)
    {
        const { distances, vectorCount, maxVector } = this;
        const visited = new Array(vectorCount).fill(false);
        const clusters = [];

        for (let vectorIndex = 0; vectorIndex < vectorCount; vectorIndex += 1)
        {
            if (visited[vectorIndex])
            {
                continue;
            }

            const stack = [vectorIndex];
            const cluster = [];
            visited[vectorIndex] = true;

            while (stack.length > 0)
            {
                const current = stack.pop();
                cluster.push(current);

                const currentOffset = current * maxVector;

                for (let neighbor = 0; neighbor < vectorCount; neighbor += 1)
                {
                    if (neighbor === current)
                    {
                        continue;
                    }

                    if (visited[neighbor])
                    {
                        continue;
                    }

                    const distance = distances[currentOffset + neighbor];

                    if (distance <= threshold)
                    {
                        visited[neighbor] = true;
                        stack.push(neighbor);
                    }
                }
            }

            clusters.push(cluster);
        }

        this.clusters = clusters;
        return clusters;
    }
    
    clusterizeStrict(threshold)
    {
        const { distances, vectorCount, maxVector } = this;

        const clusters = [];
        for (let i = 0; i < vectorCount; i += 1)
        {
            clusters.push([i]);
        }

        const canMerge = (clusterA, clusterB) =>
        {
            for (let i = 0; i < clusterA.length; i += 1)
            {
                const a = clusterA[i];
                const rowOffset = a * maxVector;

                for (let j = 0; j < clusterB.length; j += 1)
                {
                    const b = clusterB[j];
                    if (distances[rowOffset + b] > threshold)
                    {
                        return false;
                    }
                }
            }

            return true;
        };

        while (true)
        {
            let bestI = -1;
            let bestJ = -1;
            let bestScore = Infinity;

            for (let i = 0; i < clusters.length; i += 1)
            {
                for (let j = i + 1; j < clusters.length; j += 1)
                {
                    if (!canMerge(clusters[i], clusters[j]))
                    {
                        continue;
                    }

                    let maxDistance = -Infinity;

                    for (let aIndex = 0; aIndex < clusters[i].length; aIndex += 1)
                    {
                        const a = clusters[i][aIndex];
                        const rowOffset = a * maxVector;

                        for (let bIndex = 0; bIndex < clusters[j].length; bIndex += 1)
                        {
                            const b = clusters[j][bIndex];
                            const d = distances[rowOffset + b];
                            if (d > maxDistance)
                            {
                                maxDistance = d;
                            }
                        }
                    }

                    if (maxDistance < bestScore)
                    {
                        bestScore = maxDistance;
                        bestI = i;
                        bestJ = j;
                    }
                }
            }

            if (bestI === -1)
            {
                break;
            }

            clusters[bestI].push(...clusters[bestJ]);
            clusters.splice(bestJ, 1);
        }

        this.clusters = clusters;
        return clusters;
    }


}
