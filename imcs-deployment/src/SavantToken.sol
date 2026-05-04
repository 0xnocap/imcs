// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ERC721SeaDrop} from "seadrop/ERC721SeaDrop.sol";

/**
 * @title SavantToken
 * @dev Imaginary Magic Crypto Savants - SeaDrop-compatible ERC721
 *      with per-token URI override for post-mint trait updates.
 */
contract SavantToken is ERC721SeaDrop {
    mapping(uint256 => string) private _tokenURIs;

    event TokenURIUpdated(uint256 indexed tokenId, string uri);

    constructor(
        string memory name,
        string memory symbol,
        address[] memory allowedSeaDrop
    ) ERC721SeaDrop(name, symbol, allowedSeaDrop) {}

    /**
     * @dev Set a per-token URI override. Falls back to baseURI if not set.
     *      Used for updating individual token metadata after equipment/IQ changes.
     */
    function setTokenURI(uint256 tokenId, string calldata uri) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _tokenURIs[tokenId] = uri;
        emit TokenURIUpdated(tokenId, uri);
    }

    /**
     * @dev Batch set token URIs for multiple tokens.
     */
    function batchSetTokenURI(
        uint256[] calldata tokenIds,
        string[] calldata uris
    ) external onlyOwner {
        require(tokenIds.length == uris.length, "Length mismatch");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "Token does not exist");
            _tokenURIs[tokenIds[i]] = uris[i];
            emit TokenURIUpdated(tokenIds[i], uris[i]);
        }
    }

    /**
     * @dev Clear a per-token URI override, reverting to baseURI.
     */
    function clearTokenURI(uint256 tokenId) external onlyOwner {
        delete _tokenURIs[tokenId];
        emit TokenURIUpdated(tokenId, "");
    }

    /**
     * @dev Returns the token URI. Per-token override takes priority over baseURI.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (bytes(_tokenURIs[tokenId]).length > 0) {
            return _tokenURIs[tokenId];
        }
        return super.tokenURI(tokenId);
    }
}
