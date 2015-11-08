var common 	= require('./common');	// Common

function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe("Testing All Routes!", function () {
    importTest("Testing all post operations @/api/v1/posts", './tdd/post_tdd');
    importTest("Testing all competition operations @/api/v1/competitions", './tdd/competition_tdd');
	importTest("Testing all company operations @/api/v1/companies", './tdd/company_tdd');
});