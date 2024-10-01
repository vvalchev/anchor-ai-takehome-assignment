import type { MockAPI } from "./MockAPI";

type Limits = {
  rpm: number;
  tpm: number;
  monitoringInterval: number;
};

export class ApiCaller {
  private currentApiIndex = 0;
  private apiInstances: MockAPI[];
  private limits: Limits;
  private maxRetries: number;

  private requestQueue = new RequestQueue();
  private tokensUsed = 0; // Track the tokens used in the current window
  private requestsMade = 0; // Track the requests made in the current window

  constructor(apiInstances: MockAPI[], limits: Limits, maxRetries = 3) {
    this.apiInstances = apiInstances;
    this.limits = limits;
    this.maxRetries = maxRetries;
  }

  async call(tokenCount: number) {
    return new Promise<{ success: boolean } | undefined>((resolve, reject) => {
      this.requestQueue.addToQueue({ tokenCount, resolve, reject, retries: 0 });

      // The queue will eventually stop, when it is empty. So make sure it's processing the events.
      if (!this.requestQueue.getProcessingStatus()) {
        this.processQueue();
      }
    });
  }

  // Round-robin function to alternate between API instances
  private getNextApiInstance(): MockAPI {
    this.currentApiIndex =
      (this.currentApiIndex + 1) % this.apiInstances.length;
    return this.apiInstances[this.currentApiIndex];
  }

  // Function to process the queue while adhering to rate limits
  private async processQueue() {
    this.requestQueue.setProcessing(true);

    // Reset the limit every after the monitoring intervall passed
    // it would be faster if we implement a sliding window
    const timer = setInterval(() => {
      this.requestsMade = 0;
      this.tokensUsed = 0;
    }, this.limits.monitoringInterval);

    while (!this.requestQueue.isEmpty()) {
      const currentTime = Date.now();

      // If we've hit the request or token limit, wait until the next interval
      if (
        this.requestsMade >= this.limits.rpm ||
        this.tokensUsed >= this.limits.tpm
      ) {
        const waitTime =
          this.limits.monitoringInterval -
          (currentTime % this.limits.monitoringInterval);
        console.log(`Rate limit hit, waiting for ${waitTime} ms`);
        await ApiCaller.delay(waitTime);
        continue;
      }

      // are there more to process?
      const queueItem = this.requestQueue.getNextItem();
      if (!queueItem) break;

      this.callApi(queueItem);
    }

    clearInterval(timer);

    this.requestQueue.setProcessing(false);
  }

  private async callApi({ tokenCount, resolve, reject, retries }: QueueItem) {
    // Use the next API instance (round-robin) to make the API call
    const apiInstance = this.getNextApiInstance();

    try {
      const result = await apiInstance.callAPI(tokenCount);
      this.requestsMade++;
      this.tokensUsed += tokenCount;
      resolve(result);
    } catch (error) {
      // retry or reject
      if (retries < this.maxRetries) {
        this.requestQueue.addToQueue({
          tokenCount,
          resolve,
          reject,
          retries: retries + 1,
        });
      } else {
        reject(error);
      }
    }
  }

  private static async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// QueueItem type representing individual requests in the queue
type QueueItem = {
  tokenCount: number;
  resolve: Function;
  reject: Function;
  retries: number;
};

class RequestQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;

  addToQueue(item: QueueItem) {
    this.queue.push(item);
  }

  getNextItem(): QueueItem | undefined {
    return this.queue.shift();
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  setProcessing(status: boolean) {
    this.isProcessing = status;
  }

  getProcessingStatus(): boolean {
    return this.isProcessing;
  }
}
