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
            
            await timeStringStorage.storeRecord("Test");
            expect(await timeStringStorage.getRecordCount()).to.equal(1);
            
            await timeStringStorage.storeRecord("Test 2");
            expect(await timeStringStorage.getRecordCount()).to.equal(2);
        });

        it("Should revert when accessing invalid index", async function () {
            await expect(timeStringStorage.getRecord(0))
                .to.be.revertedWith("Index out of bounds");
            
            await timeStringStorage.storeRecord("Test");
            await expect(timeStringStorage.getRecord(1))
                .to.be.revertedWith("Index out of bounds");
        });
    });

    describe("User Separation", function () {
        it("Should separate records by user address", async function () {
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