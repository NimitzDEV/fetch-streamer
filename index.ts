export default class FetchStreamer {
  private originalChunkSize = 0;
  private targetChunkSize = 0;
  private url = '';
  private chunkBuffer = null;
  private reader = null;
  private decodedChunkData = null;
  private textDecoder = null;
  private callbackOnFinish = () => {
  };
  private callbackOnData = () => {
  };

  private startedAt = 0;
  private canReadNextChunk = true;
  private writtenBufferSize = 0;
  private receivedBytes = 0;
  private processedBytes = 0;
  private unconsumedBytes = 0;
  private writableLength = 0;
  private currentWriteLength = 0;
  private writingPosition = 0;


  /**
   * FetchStreamer, process data while downloading it.
   * @param url Reading URL
   * @param targetChunkSize Initial minimum processing unit size
   * @param useDefaultTextDecoder Decode each chunk to text with specific encoding. See also https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
   */
  constructor(url, targetChunkSize, useDefaultTextDecoder = null) {
    this.originalChunkSize = targetChunkSize;
    this.targetChunkSize = targetChunkSize;
    this.url = url;
    this.chunkBuffer = new Uint8Array(targetChunkSize);
    this.readerCallback = this.readerCallback.bind(this);
    if (useDefaultTextDecoder) {
      this.textDecoder = new TextDecoder(useDefaultTextDecoder);
    }
  }

  /**
   * Set onFinish callback
   * @param callback Callback function
   */
  onFinish(callback) {
    this.callbackOnFinish = callback;
  }

  /**
   * Set onData callback
   * @param callback Callback function
   */
  onData(callback) {
    this.callbackOnData = callback;
  }

  private resetBuffer(nextChunkSize) {
    this.targetChunkSize = +nextChunkSize;
    this.chunkBuffer = new Uint8Array(this.targetChunkSize);
  }

  private chunked(ended = false) {
    this.processedBytes += this.writtenBufferSize;
    this.decodedChunkData = ended
      ? this.chunkBuffer.slice(0, this.writtenBufferSize)
      : this.chunkBuffer;

    if (this.textDecoder) {
      this.decodedChunkData = this.textDecoder.decode(this.decodedChunkData);
    }

    if (ended && this.decodedChunkData.length === 0) return;

    const nextChunkSize = this.callbackOnData.call(
      this.callbackOnData,
      this.decodedChunkData,
      {
        targetSize: this.targetChunkSize,
        fulfilled: this.writtenBufferSize === this.targetChunkSize,
      },
    )

    if (nextChunkSize > 0) this.resetBuffer(nextChunkSize);

    this.chunkBuffer.fill(0);
    this.writtenBufferSize = 0;
  }

  private ended() {
    this.callbackOnFinish.call(this.callbackOnFinish, {
      bytesReceived: this.receivedBytes,
      bytesProcessed: this.processedBytes,
      elapsed: Date.now() - this.startedAt,
    });
  }

  private process(view: Uint8Array) {
    this.unconsumedBytes = view.length;
    while (this.unconsumedBytes > 0) {
      this.writableLength = this.targetChunkSize - this.writtenBufferSize;
      this.currentWriteLength = this.unconsumedBytes > this.writableLength ? this.writableLength : this.unconsumedBytes;
      this.writingPosition = view.length - this.unconsumedBytes;
      this.chunkBuffer.set(
        view.slice(this.writingPosition, this.writingPosition + this.currentWriteLength),
        this.writtenBufferSize,
      );
      this.writtenBufferSize += this.currentWriteLength;
      this.unconsumedBytes -= this.currentWriteLength;
      this.writtenBufferSize === this.targetChunkSize && this.chunked();
    }
  }

  /**
   * Pause processing, this will not pause data fetching
   */
  pause() {
    this.canReadNextChunk = false;
  }

  /**
   * Resume processing
   */
  resume() {
    this.canReadNextChunk = true;
    this.next();
  }

  private next() {
    this.canReadNextChunk && this.reader.read().then(this.readerCallback);
  }

  private readerCallback({value, done}) {
    if (done) {
      this.chunked(true);
      this.ended();
    } else {
      this.process(value);
      this.receivedBytes += value.length;
      this.next();
    }
  }

  /**
   * Start reading and processing
   */
  async start() {
    this.startedAt = Date.now();
    this.reader = await fetch(this.url)
      .then(response => response.body.getReader());

    this.next();
  }
}
