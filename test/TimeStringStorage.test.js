const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TimeStringStorage", function () {
    let timeStringStorage;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const TimeStringStorage = await ethers.getContractFactory("TimeStringStorage");
        timeStringStorage = await TimeStringStorage.deploy();
        await timeStringStorage.deployed();
    });

    describe("Store Records", function () {
        beforeEach(async function () {
            const stakeAmount = ethers.utils.parseEther("0.1");
            await timeStringStorage.connect(owner).stake({ value: stakeAmount });
        });

        it("Should store a record with current timestamp", async function () {
            const testData = "Hello World";
            
            await timeStringStorage.storeRecord(testData);
            
            const recordCount = await timeStringStorage.getRecordCount();
            expect(recordCount).to.equal(1);
            
            const [timestamp, data] = await timeStringStorage.getRecord(0);
            expect(data).to.equal(testData);
            expect(timestamp).to.be.gt(0);
        });

        it("Should emit RecordStored event", async function () {
            const testData = "Test Event";
            
            await expect(timeStringStorage.storeRecord(testData))
                .to.emit(timeStringStorage, "RecordStored")
                .withArgs(owner.address, anyValue, testData);
        });

        it("Should store multiple records", async function () {
            const testData1 = "First Record";
            const testData2 = "Second Record";
            
            await timeStringStorage.storeRecord(testData1);
            await timeStringStorage.storeRecord(testData2);
            
            const recordCount = await timeStringStorage.getRecordCount();
            expect(recordCount).to.equal(2);
            
            const [timestamp1, data1] = await timeStringStorage.getRecord(0);
            const [timestamp2, data2] = await timeStringStorage.getRecord(1);
            
            expect(data1).to.equal(testData1);
            expect(data2).to.equal(testData2);
            expect(timestamp2).to.be.gte(timestamp1);
        });
    });

    describe("Get Records", function () {
        it("Should return empty array for new user", async function () {
            const records = await timeStringStorage.getRecords();
            expect(records.length).to.equal(0);
        });

        it("Should return all user records", async function () {
            const stakeAmount = ethers.utils.parseEther("0.1");
            await timeStringStorage.connect(owner).stake({ value: stakeAmount });
            
            const testData1 = "Record 1";
            const testData2 = "Record 2";
            
            await timeStringStorage.storeRecord(testData1);
            await timeStringStorage.storeRecord(testData2);
            
            const records = await timeStringStorage.getRecords();
            expect(records.length).to.equal(2);
            expect(records[0].data).to.equal(testData1);
            expect(records[1].data).to.equal(testData2);
        });

        it("Should return correct record count", async function () {
            expect(await timeStringStorage.getRecordCount()).to.equal(0);
            
            const stakeAmount = ethers.utils.parseEther("0.1");
            await timeStringStorage.connect(owner).stake({ value: stakeAmount });
            
            await timeStringStorage.storeRecord("Test");
            expect(await timeStringStorage.getRecordCount()).to.equal(1);
            
            await timeStringStorage.storeRecord("Test 2");
            expect(await timeStringStorage.getRecordCount()).to.equal(2);
        });

        it("Should revert when accessing invalid index", async function () {
            await expect(timeStringStorage.getRecord(0))
                .to.be.revertedWith("Index out of bounds");
            
            const stakeAmount = ethers.utils.parseEther("0.1");
            await timeStringStorage.connect(owner).stake({ value: stakeAmount });
            
            await timeStringStorage.storeRecord("Test");
            await expect(timeStringStorage.getRecord(1))
                .to.be.revertedWith("Index out of bounds");
        });
    });

    describe("Staking", function () {
        it("Should allow staking with correct amount", async function () {
            const stakeAmount = ethers.utils.parseEther("0.1");
            
            await expect(timeStringStorage.connect(addr1).stake({ value: stakeAmount }))
                .to.emit(timeStringStorage, "Staked")
                .withArgs(addr1.address, stakeAmount, anyValue);
            
            const [amount, stakeTimestamp, lastDiaryTimestamp, isActive] = await timeStringStorage.getStakeInfo(addr1.address);
            expect(amount).to.equal(stakeAmount);
            expect(stakeTimestamp).to.be.gt(0);
            expect(lastDiaryTimestamp).to.equal(0);
            expect(isActive).to.be.true;
        });

        it("Should reject incorrect stake amount", async function () {
            const wrongAmount = ethers.utils.parseEther("0.05");
            
            await expect(timeStringStorage.connect(addr1).stake({ value: wrongAmount }))
                .to.be.revertedWith("Must stake exactly 0.1 ETH");
        });

        it("Should reject double staking", async function () {
            const stakeAmount = ethers.utils.parseEther("0.1");
            
            await timeStringStorage.connect(addr1).stake({ value: stakeAmount });
            
            await expect(timeStringStorage.connect(addr1).stake({ value: stakeAmount }))
                .to.be.revertedWith("Already staked");
        });

        it("Should require staking before storing records", async function () {
            await expect(timeStringStorage.connect(addr1).storeRecord("Test"))
                .to.be.revertedWith("Must stake 0.1 ETH first");
        });

        it("Should allow storing records after staking", async function () {
            const stakeAmount = ethers.utils.parseEther("0.1");
            await timeStringStorage.connect(addr1).stake({ value: stakeAmount });
            
            await expect(timeStringStorage.connect(addr1).storeRecord("Test"))
                .to.emit(timeStringStorage, "RecordStored");
            
            const [amount, stakeTimestamp, lastDiaryTimestamp, isActive] = await timeStringStorage.getStakeInfo(addr1.address);
            expect(lastDiaryTimestamp).to.be.gt(0);
        });
    });

    describe("Withdrawal", function () {
        beforeEach(async function () {
            const stakeAmount = ethers.utils.parseEther("0.1");
            await timeStringStorage.connect(addr1).stake({ value: stakeAmount });
        });

        it("Should allow withdrawal after diary interval without diary entry", async function () {
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");
            
            expect(await timeStringStorage.canWithdraw(addr1.address)).to.be.true;
            
            const balanceBefore = await addr1.getBalance();
            const tx = await timeStringStorage.connect(addr1).withdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
            const balanceAfter = await addr1.getBalance();
            
            expect(balanceAfter.add(gasUsed).sub(balanceBefore)).to.equal(ethers.utils.parseEther("0.1"));
            
            const [amount, stakeTimestamp, lastDiaryTimestamp, isActive] = await timeStringStorage.getStakeInfo(addr1.address);
            expect(amount).to.equal(0);
            expect(isActive).to.be.false;
        });

        it("Should allow withdrawal within diary interval after diary entry", async function () {
            await timeStringStorage.connect(addr1).storeRecord("Daily diary");
            
            expect(await timeStringStorage.canWithdraw(addr1.address)).to.be.true;
            
            await expect(timeStringStorage.connect(addr1).withdraw())
                .to.emit(timeStringStorage, "Withdrawn")
                .withArgs(addr1.address, ethers.utils.parseEther("0.1"), anyValue);
        });

        it("Should reject withdrawal before diary interval without diary entry", async function () {
            expect(await timeStringStorage.canWithdraw(addr1.address)).to.be.false;
            
            await expect(timeStringStorage.connect(addr1).withdraw())
                .to.be.revertedWith("Cannot withdraw yet - diary requirement not met");
        });

        it("Should reject withdrawal after diary interval expires", async function () {
            await timeStringStorage.connect(addr1).storeRecord("Daily diary");
            
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");
            
            expect(await timeStringStorage.canWithdraw(addr1.address)).to.be.false;
            
            await expect(timeStringStorage.connect(addr1).withdraw())
                .to.be.revertedWith("Cannot withdraw yet - diary requirement not met");
        });

        it("Should reject withdrawal when not staked", async function () {
            await expect(timeStringStorage.connect(addr2).withdraw())
                .to.be.revertedWith("No active stake");
        });
    });

    describe("Time Until Withdrawal", function () {
        beforeEach(async function () {
            const stakeAmount = ethers.utils.parseEther("0.1");
            await timeStringStorage.connect(addr1).stake({ value: stakeAmount });
        });

        it("Should return 0 when withdrawal is allowed", async function () {
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");
            
            expect(await timeStringStorage.timeUntilWithdrawal(addr1.address)).to.equal(0);
        });

        it("Should return time remaining until diary interval", async function () {
            const timeUntil = await timeStringStorage.timeUntilWithdrawal(addr1.address);
            expect(timeUntil).to.be.gt(0);
            expect(timeUntil).to.be.lte(7 * 24 * 60 * 60);
        });

        it("Should return max uint256 when diary interval expired", async function () {
            await timeStringStorage.connect(addr1).storeRecord("Daily diary");
            
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");
            
            const maxUint256 = ethers.constants.MaxUint256;
            expect(await timeStringStorage.timeUntilWithdrawal(addr1.address)).to.equal(maxUint256);
        });

        it("Should return 0 for non-staked user", async function () {
            expect(await timeStringStorage.timeUntilWithdrawal(addr2.address)).to.equal(0);
        });
    });

    describe("User Separation", function () {
        it("Should separate records by user address", async function () {
            const stakeAmount = ethers.utils.parseEther("0.1");
            await timeStringStorage.connect(owner).stake({ value: stakeAmount });
            await timeStringStorage.connect(addr1).stake({ value: stakeAmount });
            
            const ownerData = "Owner Data";
            const addr1Data = "Addr1 Data";
            
            await timeStringStorage.connect(owner).storeRecord(ownerData);
            await timeStringStorage.connect(addr1).storeRecord(addr1Data);
            
            const ownerRecords = await timeStringStorage.connect(owner).getRecords();
            const addr1Records = await timeStringStorage.connect(addr1).getRecords();
            
            expect(ownerRecords.length).to.equal(1);
            expect(addr1Records.length).to.equal(1);
            expect(ownerRecords[0].data).to.equal(ownerData);
            expect(addr1Records[0].data).to.equal(addr1Data);
        });

        it("Should return correct count for each user", async function () {
            const stakeAmount = ethers.utils.parseEther("0.1");
            await timeStringStorage.connect(owner).stake({ value: stakeAmount });
            await timeStringStorage.connect(addr1).stake({ value: stakeAmount });
            
            await timeStringStorage.connect(owner).storeRecord("Owner 1");
            await timeStringStorage.connect(owner).storeRecord("Owner 2");
            await timeStringStorage.connect(addr1).storeRecord("Addr1 1");
            
            expect(await timeStringStorage.connect(owner).getRecordCount()).to.equal(2);
            expect(await timeStringStorage.connect(addr1).getRecordCount()).to.equal(1);
            expect(await timeStringStorage.connect(addr2).getRecordCount()).to.equal(0);
        });
    });
});

const anyValue = (value) => true;