let currentSong = new Audio();
let songs;
let currFolder;

function formatSeconds(seconds) {
  // Round the seconds to the nearest integer
  seconds = Math.round(seconds);

  // Calculate minutes and remaining seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Format minutes and seconds as two digits
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = remainingSeconds.toString().padStart(2, "0");

  // Return the formatted time
  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;
    let a = await fetch(`/${folder}`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
      const element = as[index];
      if (element.href.endsWith(".mp3")) {
        songs.push(element.href.split(`/${folder}/`)[1]);
      }
    }

  //show all the songs in playlist
  let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
  songUL.innerHTML = ""
  for (const song of songs) {
    songUL.innerHTML =
      songUL.innerHTML +
      `<li>
              <img class="que" src="svgs/music.svg" alt="">
              <div class="info">
                <div class="song-name">${song.replaceAll("%20", " ")}</div>
                <div class="song-artist"></div>
              </div>
              <div class="playnow">
                <span>Play</span>
                <img class="play-que" src="svgs/play.svg" alt="">
              </div></li>`;
  }
  //Attaching an event listener to each song
  Array.from(
    document.querySelector(".songlist").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", (element) => {
      const songName = e.querySelector(".info .song-name").innerHTML.trim();
      playMusic(songName);
    });
  });
  return songs;
}
const play = document.querySelector("#play");

const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/` + track;
  if (!pause) {
    currentSong.play();
  }
  currentSong.paused = false;
  if (play.src === "svgs/play.svg") {
    play.src = "pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00/00:00";
};

async function displayAlbums() {
  console.log("displaying albums");

  // Fetch the contents of the Music directory
  let a = await fetch(`/Music/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;

  // Extracting folder names from the anchor tags
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".card-container");

  for (let index = 0; index < anchors.length; index++) {
      const e = anchors[index];

      // Extract folder name from the href attribute
      const href = e.getAttribute('href');
      const folderName = href.split('/').filter(Boolean).pop(); // Extract the last valid folder name

      // Skip invalid folder names like 'Music' or any folder that doesn't match your desired structure
      if (!folderName || folderName === 'Music') {
          continue;
      }

      try {
          // Fetch the info.json from the folder
          let jsonFetch = await fetch(`/Music/${folderName}/info.json`);

          if (!jsonFetch.ok) {
              console.error(`Failed to load JSON for folder: ${folderName} - Status: ${jsonFetch.status}`);
              continue;  // Skip to the next folder if the fetch fails
          }

          let responseData = await jsonFetch.json();

          // Add the album card to the container, handle missing cover image
          cardContainer.innerHTML += `
              <div data-folder="${folderName}" class="card">
                  <div class="play-btn">
                      <img src="svgs/playbtn.svg" alt="">
                  </div>
                  <img class="artists" src="/Music/${folderName}/cover.jpg" alt="Cover Image"';">
                  <h1>${responseData.title}</h1>
                  <p>${responseData.description}</p>
              </div>`;
      } catch (error) {
          console.error(`Error fetching or parsing JSON for folder: ${folderName} - `, error);
      }
  }
  //Load the playlist whenever card is clicked
  Array.from(document.getElementsByClassName("card")).forEach(e => {
    e.addEventListener("click", async () => {
      if (e.dataset.folder) {
        songs = await getSongs(`Music/${e.dataset.folder}`);
        playMusic(songs[0])
      } else {
        console.error("Folder not specified for card element");
      }
    })
  })

}

async function main() {
  //Get the list of all songs
  await getSongs("Music/ncs");
  playMusic(songs[0], true);

  //Display all the albums on the page 
  displayAlbums()

  //Attachng an event listener to play, next, previous
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      currentSong.paused = false;
      play.src = "svgs/pause.svg";
    } else {
      currentSong.pause();
      currentSong.paused = true;
      play.src = "svgs/play.svg";
    }
  });

  //listen for time update
  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${formatSeconds(
      currentSong.currentTime
    )}/${formatSeconds(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  //Add an event listener to seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  //Add an  event listener to hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  //Add an event listener to previous
  previous.addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });
  //Add an event listener to  next
  next.addEventListener("click", () => {
    currentSong.pause();

    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  //Add an event to volume
  document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
      currentSong.volume = parseInt(e.target.value) / 100;
    });

  //Add an event to volume on phone
  const volumeButton = document.querySelector(".volume-btn");
  const volumeSvg = document.querySelector(".volume-svg");

  volumeSvg.addEventListener("click", () => {
    if (currentSong.volume === 0) {
      // Unmute
      currentSong.volume = 1;
      volumeSvg.src = "svgs/volume.svg";
    } else {
      // Mute
      currentSong.volume = 0;
      volumeSvg.src = "svgs/mute.svg";
    }
  });

}

main();
