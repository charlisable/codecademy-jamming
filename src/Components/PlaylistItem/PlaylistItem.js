import React from "react";
// import './PlaylistList.css';
import Spotify from '../../util/Spotify';

class PlaylistItem extends React.Component {
    constructor(props) {
        super(props);

        this.selectPlaylist = this.selectPlaylist.bind(this);
        this.renderAction = this.renderAction.bind(this);
        this.getPlaylist = this.getPlaylist.bind(this);
    }

    selectPlaylist() {
        this.props.selectPlaylist(this.props.id);
    }
    renderAction() {
        if (this.props.playlistOwnerId == this.props.currentUserId) {
            return (
                <button onClick={this.getPlaylist}>Select to edit your playlist</button>
            )
        }
    };
    getPlaylist() {
        this.props.selectPlaylist(this.props.id, this.props.name);
        console.log("getPlaylist running");
    }
    
    render() {
        // console.log("props here",this.props);
        return (
            <div className="PlaylistI`tem">
                <div >
                    {/* render name of playlist */}
                        <div key={this.props.id} >
                            <p>{this.props.name}</p>
                            {this.renderAction()}
                        </div>
                </div>
            </div>
        );
    }
}

export default PlaylistItem;