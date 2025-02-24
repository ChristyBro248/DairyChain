// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TimeStringStorage {
    struct Record {
        uint256 timestamp;
        string data;
    }
    
    struct StakeInfo {
        uint256 amount;
        uint256 stakeTimestamp;
        uint256 lastDiaryTimestamp;
        bool isActive;
    }
    
    mapping(address => Record[]) private userRecords;
    mapping(address => StakeInfo) private userStakes;
    
    uint256 public constant REQUIRED_STAKE = 0.1 ether;
    uint256 public constant DIARY_INTERVAL = 7 days;
    
    event RecordStored(address indexed user, uint256 timestamp, string data);
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    
    function stake() public payable {
        require(msg.value == REQUIRED_STAKE, "Must stake exactly 0.1 ETH");
        require(!userStakes[msg.sender].isActive, "Already staked");
        
        userStakes[msg.sender] = StakeInfo({
            amount: msg.value,
            stakeTimestamp: block.timestamp,
            lastDiaryTimestamp: 0,
            isActive: true
        });
        
        emit Staked(msg.sender, msg.value, block.timestamp);
    }
    
    function storeRecord(string memory _data) public {
        require(userStakes[msg.sender].isActive, "Must stake 0.1 ETH first");
        
        uint256 currentTime = block.timestamp;
        userRecords[msg.sender].push(Record(currentTime, _data));
        userStakes[msg.sender].lastDiaryTimestamp = currentTime;
        
        emit RecordStored(msg.sender, currentTime, _data);
    }
    
    function withdraw() public {
        StakeInfo storage stakeInfo = userStakes[msg.sender];
        require(stakeInfo.isActive, "No active stake");
        require(canWithdraw(msg.sender), "Cannot withdraw yet - diary requirement not met");
        
        uint256 amount = stakeInfo.amount;
        stakeInfo.isActive = false;
        stakeInfo.amount = 0;
        
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount, block.timestamp);
    }
    
    function canWithdraw(address user) public view returns (bool) {
        StakeInfo memory stakeInfo = userStakes[user];
        if (!stakeInfo.isActive) return false;
        
        if (stakeInfo.lastDiaryTimestamp == 0) {
            return block.timestamp >= stakeInfo.stakeTimestamp + DIARY_INTERVAL;
        }
        
        return block.timestamp <= stakeInfo.lastDiaryTimestamp + DIARY_INTERVAL;
    }
    
    function getStakeInfo(address user) public view returns (uint256, uint256, uint256, bool) {
        StakeInfo memory stakeInfo = userStakes[user];
        return (stakeInfo.amount, stakeInfo.stakeTimestamp, stakeInfo.lastDiaryTimestamp, stakeInfo.isActive);
    }
    
    function timeUntilWithdrawal(address user) public view returns (uint256) {
        StakeInfo memory stakeInfo = userStakes[user];
        if (!stakeInfo.isActive) return 0;
        
        if (canWithdraw(user)) return 0;
        
        if (stakeInfo.lastDiaryTimestamp == 0) {
            uint256 requiredTime = stakeInfo.stakeTimestamp + DIARY_INTERVAL;
            return requiredTime > block.timestamp ? requiredTime - block.timestamp : 0;
        }
        
        uint256 deadline = stakeInfo.lastDiaryTimestamp + DIARY_INTERVAL;
        return deadline > block.timestamp ? 0 : type(uint256).max;
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