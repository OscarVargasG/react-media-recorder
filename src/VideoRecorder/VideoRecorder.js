import React, { useState, useEffect } from 'react';
import './VideoRecorder.css';

const VideoRecorder = () => {
  const [mediaSource, setMediasource] = useState(undefined);
  const [recordedBlobs, setRecordedBlobs] = useState([]);
  const [sourceBuffer, setSourceBuffer] = useState(undefined);
  const [mediaRecorder, setMediaRecorder] = useState(undefined);
  const [playButton, setPlayButton] = useState({ disabled: true });
  const [recordButton, setRecordButton] = useState({
    disabled: true,
    textContent: 'Start',
  });
  const [downloadButton, setDownloadButton] = useState({
    disabled: true,
  });
  const handleSourceOpen = event => {
    console.log('MediaSource opened');
    setSourceBuffer(mediaSource.addSourceBuffer('video/webm; codecs="vp8"'));
    console.log('Source buffer: ', sourceBuffer);
  };
  useEffect(() => {
    const newMediaSource = new MediaSource();

    newMediaSource.addEventListener('sourceopen', handleSourceOpen, false);
    setMediasource(newMediaSource);
    // eslint-disable-next-line
  }, []);

  const errorMsgElement = document.querySelector('span#errorMsg');

  const startRecording = () => {
    setRecordedBlobs([]);
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not Supported`);
      errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
      options = { mimeType: 'video/webm;codecs=vp8' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not Supported`);
        errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
        options = { mimeType: 'video/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.error(`${options.mimeType} is not Supported`);
          errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
          options = { mimeType: '' };
        }
      }
    }
    let newMediaRecorder;

    try {
      newMediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
      console.error('Exception while creating MediaRecorder:', e);
      errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(
        e,
      )}`;
      return;
    }

    console.log(
      'Created MediaRecorder',
      newMediaRecorder,
      'with options',
      options,
    );
    setRecordButton({ ...recordButton, textContent: 'Stop' });
    setPlayButton({ ...playButton, disabled: true });
    setDownloadButton({ ...downloadButton, disabled: true });
    newMediaRecorder.onstop = event => {
      console.log('Recorder stopped: ', event);
    };

    const handleDataAvailable = event => {
      let newList = [];
      if (event.data && event.data.size > 0) {
        newList = recordedBlobs;
        newList.push(event.data);
        setRecordedBlobs(newList);
      }
    };

    newMediaRecorder.ondataavailable = handleDataAvailable;
    newMediaRecorder.start(10); // collect 10ms of data
    setMediaRecorder(newMediaRecorder);
    console.log('MediaRecorder started', mediaRecorder);
  };

  const stopRecording = () => {
    console.log(JSON.stringify(mediaRecorder));
    mediaRecorder.stop();
    // console.log('Recorded Blobs: ', recordedBlobs);
  };
  const recordButtonEvenListener = () => {
    if (recordButton.textContent === 'Start') {
      startRecording();
    } else {
      console.log(JSON.stringify(mediaRecorder));
      stopRecording();
      setRecordButton({ ...recordButton, textContent: 'Start' });
      setPlayButton({ ...playButton, disabled: false });
      setDownloadButton({ ...downloadButton, disabled: false });
    }
  };

  const playButtonEvenListener = () => {
    const superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
    const recordedVideo = document.querySelector('video#recorded');

    recordedVideo.src = null;
    recordedVideo.srcObject = null;
    recordedVideo.src = window.URL.createObjectURL(superBuffer);
    recordedVideo.controls = true;
    recordedVideo.controlsList = 'nodownload';
    recordedVideo.play();
  };

  const downloadButtonEvenListener = () => {
    const blob = new Blob(recordedBlobs, { type: 'video/webm' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'test.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const handleSuccess = stream => {
    setRecordButton({ ...recordButton, disabled: false });

    console.log('getUserMedia() got stream:', stream);
    window.stream = stream;

    const gumVideo = document.querySelector('video#gum');
    console.log(stream);

    gumVideo.srcObject = stream;
  };

  const init = async constraints => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      handleSuccess(stream);
    } catch (e) {
      console.error('navigator.getUserMedia error:', e);
      errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
    }
  };

  const startClickHandler = async () => {
    // const hasEchoCancellation = document.querySelector('#echoCancellation')
    //   .checked;
    const constraints = {
      audio: {
        echoCancellation: { exact: false },
      },
      video: {
        width: 1280,
        height: 720,
      },
    };
    console.log('Using media constraints:', constraints);
    await init(constraints);
  };

  return (
    <div id="videoRecorder" className="video-recorder">
      <div className="row">
        <div className="col-md-6">
          <video className="video-player" id="gum" playsInline autoPlay muted>
            <track kind="captions" />
          </video>
        </div>
        <div className="col-md-6">
          <video className="video-player" id="recorded" playsInline loop>
            <track kind="captions" />
          </video>
        </div>
      </div>

      <div className="row">
        <button
          className="btn btn-primary"
          type="button"
          id="start"
          onClick={startClickHandler}
        >
          Start Camera
        </button>
        <button
          className="btn btn-primary"
          type="button"
          id="record"
          onClick={recordButtonEvenListener}
          disabled={recordButton.disabled}
        >
          {recordButton.textContent}
        </button>
        <button
          className="btn btn-primary"
          type="button"
          id="play"
          onClick={playButtonEvenListener}
          disabled={playButton.disabled}
        >
          Play
        </button>
        <button
          className="btn btn-primary"
          type="button"
          id="download"
          onClick={downloadButtonEvenListener}
          disabled={downloadButton.disabled}
        >
          Download
        </button>

      </div>

      {/* <div>
        <h4>Media Stream Constraints options</h4>
        <p>
          cancelacion de eco: <input type="checkbox" id="echoCancellation" />
        </p>
      </div> */}

      <div>
        <span id="errorMsg" />
      </div>
    </div>
  );
};
export default VideoRecorder;
