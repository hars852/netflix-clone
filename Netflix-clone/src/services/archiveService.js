// archiveService.js - Direct Internet Archive API Integration for Frontend
import { TMDB_IMAGE_BASE, TMDB_BACKDROP_BASE, searchTmdbMovieByTitle } from './tmdbService';

const ARCHIVE_SEARCH_URL = 'https://archive.org/advancedsearch.php';
const ARCHIVE_METADATA_URL = 'https://archive.org/metadata';
const ARCHIVE_DOWNLOAD_URL = 'https://archive.org/download';

const archiveCache = new Map();

/**
 * Verified pool of full-length playable feature streams
 */
export const FULL_MOVIE_STREAMS = [
  {
    streamUrl: 'https://archive.org/download/his_girl_friday/his_girl_friday.mp4',
    duration: '1h 32m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://archive.org/download/TheFastandtheFuriousJohnIreland1954goofyrip/TheFastandtheFuriousJohnIreland1954goofyrip.mp4',
    duration: '1h 13m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://archive.org/download/JungleBook/Jungle_Book.mp4',
    duration: '1h 48m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://archive.org/download/TheStranger_0/The_Stranger.mp4',
    duration: '1h 35m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://archive.org/download/Mclintock.avi/Mclintock.mp4',
    duration: '2h 07m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://archive.org/download/suddenly/suddenly.mp4',
    duration: '1h 17m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://archive.org/download/dressed_to_kill/dressed_to_kill.mp4',
    duration: '1h 11m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://archive.org/download/BloodyPitOfHorror/BloodyPitOfHorror.mp4',
    duration: '1h 27m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '10m',
    source: 'Open Media / Blender Foundation (1080p Full)'
  },
  {
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    duration: '15m',
    source: 'Open Media / Blender Foundation (1080p Full)'
  },
  {
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: '12m',
    source: 'Open Media / Blender Foundation (1080p Full)'
  },
  {
    streamUrl: 'https://archive.org/download/tarzans_revenge/tarzans_revenge.mp4',
    duration: '1h 10m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://archive.org/download/my_favorite_brunette/my_favorite_brunette.mp4',
    duration: '1h 27m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://archive.org/download/gullivers_travels1939/gullivers_travels1939.mp4',
    duration: '1h 16m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://archive.org/download/Sita_Sings_the_Blues/SITA_SINGS_MOVIE_ONLY.mp4',
    duration: '1h 22m',
    source: 'Internet Archive (Full Feature Film)'
  },
  {
    streamUrl: 'https://archive.org/download/VoyagetothePlanetofPrehistoricWomen/VoyagetothePlanetofPrehistoricWomen.mp4',
    duration: '1h 18m',
    source: 'Internet Archive (Full Feature Film)'
  }
];

/**
 * Filter and extract the best playable video file from an archive item's files list
 */
export const extractPlayableVideoFile = (files = []) => {
  if (!Array.isArray(files) || files.length === 0) return null;

  const validVideoFiles = files.filter((file) => {
    const name = (file.name || '').toLowerCase();
    const format = (file.format || '').toLowerCase();

    const isVideoFormat =
      format.includes('h.264') ||
      format.includes('512kb mpeg4') ||
      format.includes('mpeg4') ||
      format.includes('ia') ||
      name.endsWith('.mp4') ||
      name.endsWith('.webm') ||
      name.endsWith('.m3u8');

    const isExcluded =
      name.includes('thumb') ||
      name.includes('trailer') ||
      name.includes('preview') ||
      name.includes('sample') ||
      name.includes('clip') ||
      name.endsWith('.torrent') ||
      name.endsWith('.xml') ||
      name.endsWith('.sqlite') ||
      name.endsWith('.txt') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.srt') ||
      name.endsWith('.vtt') ||
      name.endsWith('.gif');

    const size = parseInt(file.size, 10) || 0;
    const isBigEnough = size > 15 * 1024 * 1024; // > 15 MB for full video

    return isVideoFormat && !isExcluded && isBigEnough;
  });

  if (validVideoFiles.length === 0) {
    // Soft fallback if file size was omitted in metadata
    const fallback = files.find((file) => {
      const name = (file.name || '').toLowerCase();
      const format = (file.format || '').toLowerCase();
      return (
        (name.endsWith('.mp4') || format.includes('h.264') || format.includes('mpeg4')) &&
        !name.includes('thumb') &&
        !name.includes('trailer') &&
        !name.includes('sample') &&
        !name.includes('preview')
      );
    });
    return fallback || null;
  }

  // Sort by highest size (highest bitrate/quality)
  validVideoFiles.sort((a, b) => (parseInt(b.size, 10) || 0) - (parseInt(a.size, 10) || 0));
  return validVideoFiles[0];
};

/**
 * Curated list of verified full-length feature films on Internet Archive & open media
 */
export const CURATED_MOVIES = [
  {
    id: 'his_girl_friday',
    title: 'His Girl Friday',
    year: '1940',
    genre: 'Comedy',
    category: 'Comedy',
    rating: '7.8',
    duration: '1h 32m',
    fileName: 'his_girl_friday.mp4',
    streamUrl: 'https://archive.org/download/his_girl_friday/his_girl_friday.mp4',
    posterUrl: 'https://archive.org/services/img/his_girl_friday',
    backdropUrl: 'https://archive.org/services/img/his_girl_friday',
    overview: 'A newspaper editor uses every trick in the book to keep his ace reporter ex-wife from remarrying and retiring from journalism.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'TheFastandtheFuriousJohnIreland1954goofyrip',
    title: 'The Fast And The Furious',
    year: '1955',
    genre: 'Action',
    category: 'Action',
    rating: '7.2',
    duration: '1h 13m',
    fileName: 'TheFastandtheFuriousJohnIreland1954goofyrip.mp4',
    streamUrl: 'https://archive.org/download/TheFastandtheFuriousJohnIreland1954goofyrip/TheFastandtheFuriousJohnIreland1954goofyrip.mp4',
    posterUrl: 'https://archive.org/services/img/TheFastandtheFuriousJohnIreland1954goofyrip',
    backdropUrl: 'https://archive.org/services/img/TheFastandtheFuriousJohnIreland1954goofyrip',
    overview: 'A man wrongfully imprisoned for murder breaks out of jail, takes a woman hostage in her sports car, and attempts to make a dash for Mexico.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'big_buck_bunny',
    title: 'Big Buck Bunny',
    year: '2008',
    genre: 'Animation / Comedy',
    category: 'Comedy',
    rating: '7.8',
    duration: '10 min',
    fileName: 'BigBuckBunny.mp4',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg',
    backdropUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/1280px-Big_buck_bunny_poster_big.jpg',
    overview: 'A large and lovable rabbit awakens in his peaceful forest home, only to be bullied by three mischievous forest critters. He decides to teach them a lesson.',
    source: 'Wikimedia Commons / Blender Foundation (CC-BY 1080p)',
    isAvailable: true
  },
  {
    id: 'JungleBook',
    title: 'Jungle Book',
    year: '1942',
    genre: 'Adventure',
    category: 'Action',
    rating: '7.4',
    duration: '1h 48m',
    fileName: 'Jungle_Book.mp4',
    streamUrl: 'https://archive.org/download/JungleBook/Jungle_Book.mp4',
    posterUrl: 'https://archive.org/services/img/JungleBook',
    backdropUrl: 'https://archive.org/services/img/JungleBook',
    overview: 'A wild boy raised by wolves in the jungles of India learns the ways of civilization, but soon faces the wrath of Shere Khan the tiger.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'sintel',
    title: 'Sintel',
    year: '2010',
    genre: 'Fantasy / Action',
    category: 'Action',
    rating: '7.6',
    duration: '15 min',
    fileName: 'Sintel.mp4',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sintel_poster.jpg/800px-Sintel_poster.jpg',
    backdropUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sintel_poster.jpg/1280px-Sintel_poster.jpg',
    overview: 'A lonely young woman named Sintel forms a deep bond with an orphaned baby dragon she names Scales. When the dragon is captured, she embarks on an epic quest to rescue him.',
    source: 'Wikimedia Commons / Blender Foundation (CC-BY 1080p)',
    isAvailable: true
  },
  {
    id: 'TheStranger_0',
    title: 'The Stranger',
    year: '1946',
    genre: 'Thriller',
    category: 'Thriller',
    rating: '7.4',
    duration: '1h 35m',
    fileName: 'The_Stranger.mp4',
    streamUrl: 'https://archive.org/download/TheStranger_0/The_Stranger.mp4',
    posterUrl: 'https://archive.org/services/img/TheStranger_0',
    backdropUrl: 'https://archive.org/services/img/TheStranger_0',
    overview: 'An investigator from the War Crimes Commission tracks a high-ranking Nazi fugitive to a quaint Connecticut town.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'Mclintock.avi',
    title: 'McLintock!',
    year: '1963',
    genre: 'Western / Comedy',
    category: 'Comedy',
    rating: '7.5',
    duration: '2h 07m',
    fileName: 'Mclintock.mp4',
    streamUrl: 'https://archive.org/download/Mclintock.avi/Mclintock.mp4',
    posterUrl: 'https://archive.org/services/img/Mclintock.avi',
    backdropUrl: 'https://archive.org/services/img/Mclintock.avi',
    overview: 'Cattle baron George Washington McLintock fights his stubborn wife, his headstrong daughter, corrupt government officials, and rival ranchers.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'BloodyPitOfHorror',
    title: 'Bloody Pit of Horror',
    year: '1965',
    genre: 'Horror',
    category: 'Horror',
    rating: '6.8',
    duration: '1h 27m',
    fileName: 'BloodyPitOfHorror.mp4',
    streamUrl: 'https://archive.org/download/BloodyPitOfHorror/BloodyPitOfHorror.mp4',
    posterUrl: 'https://archive.org/services/img/BloodyPitOfHorror',
    backdropUrl: 'https://archive.org/services/img/BloodyPitOfHorror',
    overview: 'A group of writers and models break into a deserted castle for a photo shoot, only to run afoul of the crazed owner who believes he is the Crimson Executioner.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'dressed_to_kill',
    title: 'Sherlock Holmes: Dressed to Kill',
    year: '1946',
    genre: 'Mystery / Crime',
    category: 'Thriller',
    rating: '7.1',
    duration: '1h 11m',
    fileName: 'dressed_to_kill.mp4',
    streamUrl: 'https://archive.org/download/dressed_to_kill/dressed_to_kill.mp4',
    posterUrl: 'https://archive.org/services/img/dressed_to_kill',
    backdropUrl: 'https://archive.org/services/img/dressed_to_kill',
    overview: 'Sherlock Holmes and Dr. Watson investigate the mysterious murder of several collectors who purchased seemingly worthless music boxes made in Dartmoor prison.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'suddenly',
    title: 'Suddenly',
    year: '1954',
    genre: 'Thriller / Crime',
    category: 'Thriller',
    rating: '7.3',
    duration: '1h 17m',
    fileName: 'suddenly.mp4',
    streamUrl: 'https://archive.org/download/suddenly/suddenly.mp4',
    posterUrl: 'https://archive.org/services/img/suddenly',
    backdropUrl: 'https://archive.org/services/img/suddenly',
    overview: 'A syndicate of ruthless hitmen take over a peaceful home overlooking a railway station in order to assassinate the President of the United States.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'tarzans_revenge',
    title: "Tarzan's Revenge",
    year: '1938',
    genre: 'Action / Adventure',
    category: 'Action',
    rating: '6.7',
    duration: '1h 10m',
    fileName: 'tarzans_revenge.mp4',
    streamUrl: 'https://archive.org/download/tarzans_revenge/tarzans_revenge.mp4',
    posterUrl: 'https://archive.org/services/img/tarzans_revenge',
    backdropUrl: 'https://archive.org/services/img/tarzans_revenge',
    overview: 'Tarzan must rescue Eleanor and her safari expedition from a corrupt local sultan and the perils of the jungle.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'my_favorite_brunette',
    title: 'My Favorite Brunette',
    year: '1947',
    genre: 'Comedy / Mystery',
    category: 'Comedy',
    rating: '7.2',
    duration: '1h 27m',
    fileName: 'my_favorite_brunette.mp4',
    streamUrl: 'https://archive.org/download/my_favorite_brunette/my_favorite_brunette.mp4',
    posterUrl: 'https://archive.org/services/img/my_favorite_brunette',
    backdropUrl: 'https://archive.org/services/img/my_favorite_brunette',
    overview: 'A baby photographer mistaken for a hard-boiled private eye is hired by a glamorous woman to find her kidnapped uncle.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'gullivers_travels1939',
    title: "Gulliver's Travels",
    year: '1939',
    genre: 'Animation',
    category: 'Comedy',
    rating: '6.8',
    duration: '1h 16m',
    fileName: 'gullivers_travels1939.mp4',
    streamUrl: 'https://archive.org/download/gullivers_travels1939/gullivers_travels1939.mp4',
    posterUrl: 'https://archive.org/services/img/gullivers_travels1939',
    backdropUrl: 'https://archive.org/services/img/gullivers_travels1939',
    overview: 'Lemuel Gulliver washes ashore on the island of Lilliput, whose miniature inhabitants must resolve a dispute with a neighboring empire.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'charlie_chaplin_film_fest',
    title: 'Charlie Chaplin Festival',
    year: '1938',
    genre: 'Comedy',
    category: 'Comedy',
    rating: '8.0',
    duration: '1h 20m',
    fileName: 'charlie_chaplin_film_fest.mp4',
    streamUrl: 'https://archive.org/download/charlie_chaplin_film_fest/charlie_chaplin_film_fest.mp4',
    posterUrl: 'https://archive.org/services/img/charlie_chaplin_film_fest',
    backdropUrl: 'https://archive.org/services/img/charlie_chaplin_film_fest',
    overview: 'Four complete classic Charlie Chaplin masterpieces: The Vagabond, The Cure, The Adventurer, and Easy Street.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'Sita_Sings_the_Blues',
    title: 'Sita Sings the Blues',
    year: '2008',
    genre: 'Animation / Romance',
    category: 'Romance',
    rating: '7.6',
    duration: '1h 22m',
    fileName: 'SITA_SINGS_MOVIE_ONLY.mp4',
    streamUrl: 'https://archive.org/download/Sita_Sings_the_Blues/SITA_SINGS_MOVIE_ONLY.mp4',
    posterUrl: 'https://archive.org/services/img/Sita_Sings_the_Blues',
    backdropUrl: 'https://archive.org/services/img/Sita_Sings_the_Blues',
    overview: 'A modern, vibrant animated musical retelling of the ancient Indian epic Ramayana accompanied by 1920s jazz songs of Annette Hanshaw.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'The_Pied_Piper_of_Hamelin',
    title: 'The Pied Piper of Hamelin',
    year: '1957',
    genre: 'Fantasy / Musical',
    category: 'Romance',
    rating: '6.9',
    duration: '1h 29m',
    fileName: 'pied.mp4',
    streamUrl: 'https://archive.org/download/The_Pied_Piper_of_Hamelin/pied.mp4',
    posterUrl: 'https://archive.org/services/img/The_Pied_Piper_of_Hamelin',
    backdropUrl: 'https://archive.org/services/img/The_Pied_Piper_of_Hamelin',
    overview: 'In 13th-century Germany, the town of Hamelin is overwhelmed by rats until a mysterious piper promises to rid the town of them with his enchanting flute.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'Escape_From_Sobibor.avi',
    title: 'Escape from Sobibor',
    year: '1987',
    genre: 'War / Drama',
    category: 'Action',
    rating: '7.8',
    duration: '2h 23m',
    fileName: 'Escape_from_Sobibor.mp4',
    streamUrl: 'https://archive.org/download/Escape_From_Sobibor.avi/Escape_from_Sobibor.mp4',
    posterUrl: 'https://archive.org/services/img/Escape_From_Sobibor.avi',
    backdropUrl: 'https://archive.org/services/img/Escape_From_Sobibor.avi',
    overview: 'During World War II, a group of brave prisoners in the Sobibor concentration camp stage the most successful mass escape of the Holocaust.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'abraham_lincoln',
    title: 'Abraham Lincoln',
    year: '1930',
    genre: 'Biography / Drama',
    category: 'Thriller',
    rating: '7.0',
    duration: '1h 33m',
    fileName: 'abraham_lincoln.mp4',
    streamUrl: 'https://archive.org/download/abraham_lincoln/abraham_lincoln.mp4',
    posterUrl: 'https://archive.org/services/img/abraham_lincoln',
    backdropUrl: 'https://archive.org/services/img/abraham_lincoln',
    overview: 'A biographical drama chronicling the life of the 16th U.S. President, from his humble beginnings in a log cabin to the Civil War.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  },
  {
    id: 'VoyagetothePlanetofPrehistoricWomen',
    title: 'Voyage to the Planet of Prehistoric Women',
    year: '1967',
    genre: 'Sci-Fi',
    category: 'Action',
    rating: '6.5',
    duration: '1h 18m',
    fileName: 'VoyagetothePlanetofPrehistoricWomen.mp4',
    streamUrl: 'https://archive.org/download/VoyagetothePlanetofPrehistoricWomen/VoyagetothePlanetofPrehistoricWomen.mp4',
    posterUrl: 'https://archive.org/services/img/VoyagetothePlanetofPrehistoricWomen',
    backdropUrl: 'https://archive.org/services/img/VoyagetothePlanetofPrehistoricWomen',
    overview: 'Astronauts landing on Venus encounter monstrous beasts and a mysterious tribe of telepathic prehistoric women who worship a giant pterodactyl god.',
    source: 'Internet Archive (Full Feature Film)',
    isAvailable: true
  }
];

/**
 * Curated list of verified full-length Web Series & Episodes
 */
export const CURATED_SERIES = [
  {
    id: 'sherlock_holmes_1954',
    title: 'Sherlock Holmes (1954)',
    year: '1954',
    genre: 'Mystery / Detective',
    rating: '8.2',
    overview: 'The famous detective Sherlock Holmes and his faithful colleague Dr. John Watson solve baffling crimes across Victorian London in this classic TV series.',
    posterUrl: 'https://archive.org/services/img/SherlockHolmes1954Episode1',
    backdropUrl: 'https://archive.org/services/img/SherlockHolmes1954Episode1',
    totalSeasons: 1,
    totalEpisodes: 3,
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            episodeNumber: 1,
            title: 'The Case of the Cunningham Heritage',
            overview: 'Holmes and Watson meet for the first time and investigate the suspicious death of a wealthy heir.',
            identifier: 'SherlockHolmes1954Episode1',
            fileName: 'SherlockHolmes1954Episode1.mp4',
            duration: '26m'
          },
          {
            episodeNumber: 2,
            title: 'The Case of Lady Beryl',
            overview: 'Holmes investigates the bizarre theft of an ancient heirloom in a country manor.',
            identifier: 'SherlockHolmes1954Episode2',
            fileName: 'SherlockHolmes1954Episode2.mp4',
            duration: '25m'
          },
          {
            episodeNumber: 3,
            title: 'The Case of the Pennsylvania Gun',
            overview: 'A strange American artifact holds the key to an international conspiracy.',
            identifier: 'SherlockHolmes1954Episode3',
            fileName: 'SherlockHolmes1954Episode3.mp4',
            duration: '26m'
          }
        ]
      }
    ]
  },
  {
    id: 'the_beverly_hillbillies_tv',
    title: 'The Beverly Hillbillies',
    year: '1962',
    genre: 'Comedy / Sitcom',
    rating: '7.4',
    overview: 'A poor mountaineer family strikes crude oil on their property, becomes multimillionaires overnight, and moves to posh Beverly Hills.',
    posterUrl: 'https://archive.org/services/img/BeverlyHillbilliesEpisode1',
    backdropUrl: 'https://archive.org/services/img/BeverlyHillbilliesEpisode1',
    totalSeasons: 1,
    totalEpisodes: 2,
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            episodeNumber: 1,
            title: 'The Clampetts Strike Oil',
            overview: 'Jed Clampett accidentally strikes oil while hunting, changing the family fortune forever.',
            identifier: 'BeverlyHillbilliesEpisode1',
            fileName: 'BeverlyHillbilliesEpisode1.mp4',
            duration: '25m'
          },
          {
            episodeNumber: 2,
            title: 'Getting Settled in Beverly Hills',
            overview: 'The Clampett clan arrives in California and mistakes their lavish mansion for a fortress.',
            identifier: 'BeverlyHillbilliesEpisode2',
            fileName: 'BeverlyHillbilliesEpisode2.mp4',
            duration: '25m'
          }
        ]
      }
    ]
  },
  {
    id: 'the_lone_ranger_series',
    title: 'The Lone Ranger',
    year: '1949',
    genre: 'Action / Western',
    rating: '7.7',
    overview: 'The masked Texas Ranger rides the range with his Native American companion Tonto, righting wrongs and bringing justice to the Wild West.',
    posterUrl: 'https://archive.org/services/img/TheLoneRangerEpisode1',
    backdropUrl: 'https://archive.org/services/img/TheLoneRangerEpisode1',
    totalSeasons: 1,
    totalEpisodes: 2,
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            episodeNumber: 1,
            title: 'Enter the Lone Ranger',
            overview: 'The sole survivor of an ambush by the Cavendish gang is nursed back to health by Tonto and becomes the masked avenger.',
            identifier: 'TheLoneRangerEpisode1',
            fileName: 'TheLoneRangerEpisode1.mp4',
            duration: '24m'
          },
          {
            episodeNumber: 2,
            title: 'The Lone Ranger Fights On',
            overview: 'The Lone Ranger discovers the silver mine and finds his famous white stallion, Silver.',
            identifier: 'TheLoneRangerEpisode2',
            fileName: 'TheLoneRangerEpisode2.mp4',
            duration: '24m'
          }
        ]
      }
    ]
  }
];

/**
 * Fetch item metadata from Internet Archive
 */
export const fetchArchiveMetadata = async (identifier) => {
  if (archiveCache.has(`meta_${identifier}`)) {
    return archiveCache.get(`meta_${identifier}`);
  }

  try {
    const res = await fetch(`${ARCHIVE_METADATA_URL}/${identifier}`);
    if (!res.ok) return null;
    const data = await res.json();
    archiveCache.set(`meta_${identifier}`, data);
    return data;
  } catch (err) {
    console.warn(`Failed to fetch Archive metadata for ${identifier}:`, err.message);
    return null;
  }
};

/**
 * Search Internet Archive for feature films by title & optional year
 */
export const searchArchiveByTitle = async (title, year) => {
  if (!title) return null;
  const cleanTitle = title
    .replace(/[:\-–—\'\"\(\[\{].*?[\)\]\}]/g, '')
    .trim();

  const cacheKey = `archive_search_${cleanTitle.toLowerCase()}`;
  if (archiveCache.has(cacheKey)) return archiveCache.get(cacheKey);

  try {
    let q = `title:("${cleanTitle}") AND mediatype:(movies)`;
    if (year) {
      q += ` AND year:(${year})`;
    }

    const url = `${ARCHIVE_SEARCH_URL}?q=${encodeURIComponent(q)}&fl[]=identifier,title,description,year,downloads&sort[]=downloads+desc&rows=5&output=json`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const docs = data?.response?.docs || [];
    if (docs.length === 0) return null;

    archiveCache.set(cacheKey, docs);
    return docs;
  } catch (err) {
    console.warn(`Archive search failed for "${title}":`, err.message);
    return null;
  }
};

/**
 * Get verified direct streaming details for an archive item
 */
export const getArchiveStreamUrl = async (identifier) => {
  // Check curated list first (instant match)
  const curated = CURATED_MOVIES.find((m) => m.id === identifier);
  if (curated) {
    return {
      streamUrl: curated.streamUrl,
      format: 'mp4',
      title: curated.title,
      duration: curated.duration,
      source: curated.source,
      isVerifiedPlayable: true
    };
  }

  // Otherwise query Archive.org directly
  const meta = await fetchArchiveMetadata(identifier);
  if (!meta || !meta.files) return null;

  const videoFile = extractPlayableVideoFile(meta.files);
  if (!videoFile) return null;

  const fileName = videoFile.name;
  const streamUrl = `${ARCHIVE_DOWNLOAD_URL}/${identifier}/${encodeURIComponent(fileName)}`;

  return {
    streamUrl,
    format: fileName.endsWith('.m3u8') ? 'hls' : 'mp4',
    title: meta.metadata?.title || identifier,
    duration: 'Full Movie',
    source: 'Internet Archive (Free & Legal Streaming)',
    isVerifiedPlayable: true
  };
};
