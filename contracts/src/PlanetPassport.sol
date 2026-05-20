// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title imToken 10 周年 · 星球钱包 AI 共创纪念护照（Sepolia 测试网）
/// @notice 每个地址限铸 1 枚；metadata 由钱包端以 data URI 传入
contract PlanetPassport {
    string public constant NAME = "imToken 10Y Planet Passport";
    string public constant SYMBOL = "IT10PP";

    uint256 public nextTokenId;
    mapping(uint256 tokenId => address owner) internal _owners;
    mapping(uint256 tokenId => string uri) internal _tokenURIs;
    mapping(address account => bool) public hasMinted;
    mapping(address account => uint256 tokenId) public passportOf;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    function mint(string calldata tokenURI_) external returns (uint256 tokenId) {
        require(!hasMinted[msg.sender], "PlanetPassport: already minted");
        hasMinted[msg.sender] = true;
        tokenId = nextTokenId++;
        _owners[tokenId] = msg.sender;
        _tokenURIs[tokenId] = tokenURI_;
        passportOf[msg.sender] = tokenId;
        emit Transfer(address(0), msg.sender, tokenId);
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "PlanetPassport: invalid token");
        return owner;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return hasMinted[owner] ? 1 : 0;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "PlanetPassport: invalid token");
        return _tokenURIs[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC165
            interfaceId == 0x80ac58cd || // ERC721
            interfaceId == 0x5b5e139f; // ERC721Metadata
    }
}
