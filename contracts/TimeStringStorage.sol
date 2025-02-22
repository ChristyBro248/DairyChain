// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TimeStringStorage {
    struct Record {
        uint256 timestamp;
        string data;
    }
    
    mapping(address => Record[]) private userRecords;
    
    event RecordStored(address indexed user, uint256 timestamp, string data);
    
    function storeRecord(string memory _data) public {
        uint256 currentTime = block.timestamp;
        userRecords[msg.sender].push(Record(currentTime, _data));
        emit RecordStored(msg.sender, currentTime, _data);
    }
    
    function getRecords() public view returns (Record[] memory) {
        return userRecords[msg.sender];
    }
    
    function getRecordCount() public view returns (uint256) {
        return userRecords[msg.sender].length;
    }
    
    function getRecord(uint256 _index) public view returns (uint256, string memory) {
        require(_index < userRecords[msg.sender].length, "Index out of bounds");
        Record memory record = userRecords[msg.sender][_index];
        return (record.timestamp, record.data);
    }
}