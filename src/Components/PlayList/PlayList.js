import React from "react";
import TrackList from "../TrackList/TrackList";
import './Playlist.css';
class Playlist extends React.Component {
    constructor(props) {
        super(props);

        this.handleNameChange = this.handleNameChange.bind(this);
        this.savePlaylist = this.savePlaylist.bind(this);
    }

    handleNameChange(event) {
        this.props.onNameChange(event.target.value);
    }

    savePlaylist() {
        this.props.onSave();
    }

    render() {
        return (
            <div className="Playlist">
                <input defaultValue={this.props.playlistName} onChange={this.handleNameChange} />
                <TrackList tracks={this.props.playListTracks} onRemove={this.props.onRemove} isRemoval={true} />
                <button className="Playlist-save" onClick={this.savePlaylist} >SAVE TO SPOTIFY</button>
            </div>
        );
    }
}

export default Playlist;