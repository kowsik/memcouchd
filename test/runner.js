this.run = function(tests) {
    var dummy = function() {}
    var t, test, setup = tests.setup || dummy, teardown = tests.teardown || dummy;
    for (t in tests) {
        if (tests.hasOwnProperty(t) && /^test_/.test(t)) {
            process.stdout.write(t + '...');
            try {
                var v = setup();
                tests[t](v);
                process.stdout.write('ok\n');
            } catch(e) {
                process.stdout.write("failed\n");
                console.log(e.message);
            } finally {
                teardown(v);
            }
        }
    }
}