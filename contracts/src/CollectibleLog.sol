// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollectibleLog is ERC721, Ownable {
    uint256 private _nextTokenId;

    struct Entry {
        string name;
        string location;
        uint256 timestamp;
        string imageURI;
    }

    mapping(uint256 => Entry) public entries;

    event EntryMinted(address indexed to, uint256 indexed tokenId, string name, string location);

    constructor() ERC721("CollectibleLog", "CLOG") Ownable(msg.sender) {}

    function mint(
        string calldata name,
        string calldata location,
        string calldata imageURI
    ) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        entries[tokenId] = Entry({
            name: name,
            location: location,
            timestamp: block.timestamp,
            imageURI: imageURI
        });
        emit EntryMinted(msg.sender, tokenId, name, location);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Entry memory e = entries[tokenId];
        
        return string(abi.encodePacked(
            '{"name":"', e.name,
            '","description":"Logged at ', e.location,
            '","image":"', e.imageURI,
            '","attributes":[{"trait_type":"Location","value":"', e.location,
            '"},{"trait_type":"Timestamp","display_type":"date","value":', _toString(e.timestamp),
            '}]}'
        ));
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
