import React from "react";
import './PlaylistList.css';
import PlaylistItem from "../PlaylistItem/PlaylistItem";
import Spotify from '../../util/Spotify';

class PlaylistList extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        // console.log("in playlistList.js: ", this.props);
        return (
            <div className="PlaylistList">
                <div >
                    <h2>My Saved Playlists</h2>
                    {/* render name of playlist */}
                    {this.props.playlists?.map(playlist => (
                        <PlaylistItem
                            key={playlist.id}
                            id={playlist.id}
                            name={playlist.name}
                            playlistOwnerId={playlist.playlistOwnerId}
                            currentUserId={this.props.currentUserId}
                            selectPlaylist={this.props.selectPlaylist}
                        />
                    ))}

                </div>
            </div>
        );
    }
}

export default PlaylistList;