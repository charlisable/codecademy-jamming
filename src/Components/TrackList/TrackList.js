import React from "react";
import Track from "../Track/Track";
import './TrackList.css';

class TrackList extends React.Component {
    render() {
        // console.log(this.props);
        return (
            <div className="TrackList">
                {/* <!-- You will add a map method that renders a set of Track components  --> */}
                {this.props.tracks?.map(track => (
                    <Track 
                    track={track} 
                    key={track.id} 
                    onAdd={this.props.onAdd} 
                    onRemove={this.props.onRemove} 
                    isRemoval={this.props.isRemoval} />
                ))}
            </div>
        );
    }
}

export default TrackList;