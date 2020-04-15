# FetchStreamer
This library utilize `ReadableStream` that provide in `fetch`, to let you process structured data while downloading it.
This library is most usable when you want to process data like the following:

Data stream contains data units with fixed length
```
bace138be6953bbff4c0a97057d55691c124dc949ad38ae4d9dc31b35d4cef4cfa7416d63d56b3d17b49555aab14c5c1ac466ecec1c74c6db6dbe81518cee1c1
```
The above data is the combine of 4 md5 hashes, and you want to process it as soon as every 32 bytes of data became available.

## Examples
Fixed length
```javascript
const url = 'http://localhost:3000/data';
const streamer = new FetchStreamer(url, 32, 'utf-8');
streamer.onData((data) => {
  // callback will be called every time 32 bytes of data became available
})

streamer.start();
```

Dynamic length
```javascript
const url = 'http://localhost:3000/data';

// This time, the actual data length will be presented in every chunk's first byte.
const streamer = new FetchStreamer(url, 1, 'utf-8');
streamer.onData((data, info) => {
  if (info.targetSize === 1) {
    console.log(`It's header, next chunk's length should be`, data);
    return +data;
  } else {
    console.log(`Consumable data`, data.length, data);
    return 1;
  }
});
streamer.start();
```

Checkout example folder for more details.

## APIs
#### constructor(url, initialSize, textDecoderEncoding)
url: Reading url
initialSize: Default chunk size
textDecoderEncoding: If supplied, the data you receive in onData callback will be decoded first. See also https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder


### Events
#### onData((data, info) => {})
This event will be fired every time when buffer reaches targeted size.

data: Chunk data
info: 
```json
{ 
  "targetSize": 0, // this chunk's target size
  "fulfilled": true, // indicates this chunk matches the length you are expect, it will be false when it's final chunk and the legnth is shorter than the setting
}
```

#### onFinish((info) => {})
This event will be fired when there is no more data to read

info: 
```json
{
  "bytesProcessed": 39,
  "bytesReceived": 39,
  "elapsed": 1107
}
```

### Methods
#### pause()
Pause processing, this will not pause fetching.

#### resume()
Resume paused processing process.

## License
MIT
