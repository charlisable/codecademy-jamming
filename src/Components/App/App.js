import React from 'react';
import SearchResults from '../SearchResults/SearchResults';
import PlayList from "../PlayList/PlayList";
import SearchBar from "../SearchBar/SearchBar";
import Spotify from '../../util/Spotify';
import PlaylistList from "../PlaylistList/PlaylistList";
import './App.css';

class App extends React.Component {
  constructor(props) {
    super();

    this.state = {
      searchResults: [],
      playlistName: "my playlist",
      playlistTracks: [],
      playlistList: [],
      currentUserId: '',
      playlistId: '',
    };

    this.addTrack = this.addTrack.bind(this);
    this.removeTrack = this.removeTrack.bind(this);
    this.updatePlaylistName = this.updatePlaylistName.bind(this);
    this.savePlaylist = this.savePlaylist.bind(this);
    this.search = this.search.bind(this);
    this.selectPlaylist = this.selectPlaylist.bind(this);
  };
  async componentDidMount() {
    await Spotify.getUserPlaylists().then((result) => {
      this.setState({ playlistList: result });
    })
    await Spotify.getCurrentUserId().then((result) => {

      this.setState({ currentUserId: result });
    });
    console.log(this.state.currentUserId);
  }

  addTrack(track) {
    if (this.state.playlistTracks.find(savedTrack => savedTrack.id === track.id)) {
      return;
    }
    this.setState({
      playlistTracks: [...this.state.playlistTracks, track]
    });
  }

  removeTrack(track) {
    this.setState(prevState => ({
      playlistTracks: prevState.playlistTracks.filter(
        playlistTrack => playlistTrack.id !== track.id
      )
    }));
  }

  updatePlaylistName(name) {
    this.setState(
      { playlistName: name }
    )
  }

  savePlaylist() {
    console.log("SAVEPLAYLIST CALLED");
    // if playlistID exists pass as argument and call the post request to change playlist
    const trackURIs = this.state.playlistTracks.map(track => track.uri);
    Spotify.savePlayList(this.state.playlistName, trackURIs, this.state.playlistId);
    // this.setState({ playlistName: "New Playlist", playlistTracks: [] });
    this.setState({ playlistTracks: [], playlistId: '' });
  }

  search(searchTerm) {
    Spotify.search(searchTerm).then((result) => {
      this.setState({ searchResults: result });
    })
  }

  selectPlaylist(id, name) {
    console.log("selectPlaylist called:", id, name);

    Spotify.getPlaylist(id).then((results) => {
      this.setState(
        {
          playlistName: name,
          playlistTracks: results,
          playlistId: id
        },
        () => {
          console.log("AFTER SELECT:", this.state);
        }
      );
    });
  }


  render() {
    return (
      <div>
        <h1>Ja<span className="highlight">mmm</span>ing</h1>
        <div className="App">
          <SearchBar onSearch={this.search} />
          <div className="App-playlist">
            <SearchResults searchResults={this.state.searchResults} onAdd={this.addTrack} />
            <PlayList playlistName={this.state.playlistName} playListTracks={this.state.playlistTracks} onRemove={this.removeTrack} onNameChange={this.updatePlaylistName} onSave={this.savePlaylist} />
          </div>
          <div>
            <PlaylistList playlists={this.state.playlistList} selectPlaylist={this.selectPlaylist} currentUserId={this.state.currentUserId} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
