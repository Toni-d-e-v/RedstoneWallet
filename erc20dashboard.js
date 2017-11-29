	if (typeof erc20contract_address == "undefined") {
		var erc20contract_address = "0xe895ca33788C5812119AE5F5c98A78924931F2D5";
		var erc20contract_function_address = "0xe2eB8871aeCaB528E3A36BF8a9b2D9A044b39626";
		var option_etherscan_api = 'https://api.etherscan.io'; //change to https://api.etherscan.io for mainnet
		var option_etherscan_api_key = 'QSUZ77YJZ2H68K6SJKRZSAP7ERYJS51893';
		var option_registration_enabled = true;
		var option_registration_backend = 'https://intel.worldbit.com/kyc_interface.php'; ///'subscribe.php'; //you can use remote address like https://yoursite.com/subscribe.php
		var option_recive_btc = ''; //reserved for future
	}

	var ks = localStorage.getItem('keystore');
	if (ks) {
		ks = lightwallet.keystore.deserialize(ks);
	}

	var _balance;

	function try2buy(amounteth) {
		$("#consolebuy").html('.:...::');
		if (_balance < parseFloat(amounteth) + parseFloat(0.00005)) {
			$("#consolebuy").html("You need " + amounteth + "+0.02 ETH on balance for this operation");
		} else {

			if (confirm('You want buy TOKENS for ' + amounteth + ' ETH?')) {

				sendRwTr(amounteth, "", "", "#consolebuy");
			}
		}
	}

	function try2sell() {
		$("#consolesell").html('.:...::');
		if ($("#skoko").val() < 1) {
			alert("You have " + $("#skoko").val() + " tokens");
		} else {

			if (tosell = prompt('How many NXP you want to sell?', $("#skoko").val())) {
				sendRwTr(0, [tosell], "sell", "#consolesell");
			}
		}
	}

	function try2withdrawETH() {
		$("#consolewithdraw").html('.:...::');

		var toamount = _balance - 0.019;
		if (tosell = prompt('Enter ETH address (0x...)', erc20contract_address)) {
			sendRwTr(toamount, "", "", "#consolewithdraw", tosell);
		}

	}

	urlApi = option_etherscan_api;
	//$("#to").val();
	function sendRwTr(value1, args, abifunc, callback = "#consolesell", to = erc20contract_address) {
		console.log("sendRwTr");
		$.ajax({
			type: "POST",
			url: option_etherscan_api + "/api?module=proxy&action=eth_getTransactionCount&address=" + openkey + "&tag=latest&apikey=" + option_etherscan_api_key,
			dataType: 'json',
			async: false,
			success: function (d) {


				var options = {};
				options.nonce = d.result;
				options.to = to;
				options.gasPrice = Web3.utils.toHex('5000000000');
				options.gasLimit = 0x927c0; //web3.toHex('600000');
				options.value = value1 * 1000000000000000000;


				/*
				var tx = new EthJS.Tx(options);
				tx.sign(EthJS.Buffer.Buffer(privkey,'hex'));
				var serializedTx = tx.serialize().toString('hex');
				*/
				password = prompt('Enter password for encryption', 'password');
				if (password || password === '') {

					ks.keyFromPassword(password, function (err, pwDerivedKey) {
						if (err) {
							alert(err);
						}


						if (abifunc == "") {
							var registerTx = lightwallet.txutils.valueTx(options);
						} else {
							var registerTx = lightwallet.txutils.functionTx(ERC20ABI, abifunc, args, options);
						}

						var signedTx = lightwallet.signing.signTx(ks, pwDerivedKey, registerTx, localStorage.getItem("openkey"));
						//console.log(signedTx);
						$.ajax({
							method: "GET",
							url: urlApi + "/api?module=proxy&action=eth_sendRawTransaction&hex=" + "0x" + signedTx + "&apikey=" + option_etherscan_api_key,
							success: function (d) {
								//onsole.log(d);
								$(callback).html("<A target=_blank href='" + option_etherscan_api.replace("api.", "") + "/tx/" + d.result + "'>" + d.result + "</a>");

								if (typeof d.error != "undefined") {
									if (d.error.message.match(/Insufficient fund/)) d.error.message = 'Error: you must have a small amount of ETH in your account in order to cover the cost of gas. Add 0.02 ETH to this account and try again.'; //If you are getting an insufficient balance for gas ... error, you must have a small amount of ETH in your account in order to cover the cost of gas. Add 0.01 ETH to this account and try again.
									$(callback).html(d.error.message);
								}

							},
							fail: function (d) {
								alert("send transaction error");
							}
						}, "json");

					});
				} else {
					alert("enter password");
				}
			}
		});

	}

	openkey = localStorage.getItem("openkey");
	$("#openkey").val(openkey);
	$("#openkeyspan").html(openkey);
	$("#privkey").html(localStorage.getItem("privkey"));
	privkey = localStorage.getItem("privkey");



	$("#ethqr").prop("src", "https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=" + openkey + "&choe=UTF-8&chld=L|0");


	$("#savethis").val("Warning! Withdraw all amounts of NXP to your own ethereum wallet! Save this information to your local device! \r\nopenkey:" + openkey + "\r\nprivkey:" + privkey);




	function rebalance() {

		if (typeof extrahook === "function") {
			extrahook();
		}

		if (!openkey) openkey = "0x";

		if (localStorage.getItem("name")) {
			$(".hiname").html("Hi " + localStorage.getItem("name") + "!");
		} else {
			$(".hiname").html("");
		}

		$.ajax({
			type: "GET",
			url: urlApi + "/api?module=account&action=balance&address=" + openkey + "&tag=latest&apikey=" + option_etherscan_api_key,
			dataType: 'json',

			success: function (d) {

				console.log("balance check ", d, d.result);
				_balance = d.result / 1000000000000000000;
				$(".balance").html(_balance + " ETH");

				if (_balance > 0.01) {
					$("#withall").show();
				}

			}
		});

		// url: urlApi+"/api?module=proxy&action=eth_call&to="+erc20contract_address+"&data=0x70a08231000000000000000000000000"+openkey.replace('0x','')+"&tag=latest&apikey="+option_etherscan_api_key, 
		$.ajax({
			type: "GET",
			url: urlApi + "/api?module=account&action=tokenbalance&contractaddress=" + erc20contract_function_address + "&address=" + openkey + "&tag=latest&apikey=" + option_etherscan_api_key,
			dataType: 'json',

			success: function (d) {

				amount = Web3.utils.fromWei(d.result, "ether");
				console.log("-->", d.result);
				$(".balacnetokensnocss").html(amount);
				$("#sk").val(amount);
				$("#skoko").val(amount);

				$(".balacnetokens").html(amount);
				if (amount > 0) {
					// $(".onlyhavetoken").show();
					// $(".onlynohavetoken").hide();
				}
			}
		});


		$.get(urlApi + "/api?module=transaction&action=getstatus&txhash=" + openkey + "&apikey=" + option_etherscan_api_key, function (d) {
			console.log(d);
		});
		rebuild_buttons();
		if ($("#openkey").val() == '0x') $("#openkey").val(openkey);

	}




	function recalc() {
		if (typeof tokens_for_one_eth != "number") return false;
		teth = Math.ceil($("#amount").val() / tokens_for_one_eth * 10000000) / 10000000;
		$("#ethfor100hmq").html(teth);


		if (parseFloat($("#price_btc").html()) > 0) {
			$("#btcfor100hmq").html(teth * parseFloat($("#price_btc").html()));
		}
		if (parseFloat($("#price_usd").html()) > 0) {
			$("#usdfor100hmq").html(teth * parseFloat($("#price_usd").html()));
		}

		rebuild_buttons();
	}


	function rebuild_buttons() {
		if (_balance > parseFloat($("#ethfor100hmq").html())) {
			$("#try2buybtn").removeAttr("disabled", true);

		} else {
			$("#try2buybtn").attr("disabled", true);

		}

		$(".mailto").prop("href", "mailto:?subject=Private key for " + window.location + "&body=" + getmsg());
	}

	function getmsg() {
		return "WorldBit Token Wallet \r\n\r\nEthereum address: " + openkey + "  \r\nMnemonic Phrase: '" + localStorage.getItem("d12keys") + "'\n\n\rWallet String (Cut and paste this long string below to get back into the wallet)\n\n\r" + localStorage.getItem('keystore');
	}

	$(function () {
		$("#slider-range-max").slider({
			range: "max",
			min: 1,
			max: 1000,
			value: 500,
			slide: function (event, ui) {
				$("#amount").val(ui.value);
				recalc();
			},
			change: function (event, ui) {
				$("#openkey").select();
				if (_balance > parseFloat($("#ethfor100hmq").html())) {
					$("#try2buybtn").select();
					$("#try2buybtn").removeAttr("disabled", true);
					$("#consolebuy").html("Buy " + $("#amount").val() + " for " + $("#ethfor100hmq").html());
				} else {
					$("#try2buybtn").attr("disabled", true);
					$("#consolebuy").html("Topup your balance!");
				}
			}
		});

		$("#amount").val($("#slider-range-max").slider("value"));
		recalc();
		build_masonry()
	});


	function build_masonry() {
		var $grid = jQuery('#info2').masonry({
			itemSelector: '.griditem',

			columnWidth: '.col-md-4'
		});

		$grid.masonry();
	}

	function g(n) {
		return localStorage.getItem(n);
	}

	function s(n, v) {
		localStorage.setItem(n, v);
	}

	function generate_ethereum_keys() {

	}

	function build_state() {

		$("#mysmart").prop('href', option_etherscan_api.replace("api.", "") + "/address/" + erc20contract_address);
		if (g("registered") == 1) {
			$("#name").hide();
			$("#email").hide();
			$("#pass").hide();
			$("#reg").hide();
			$("#info2").show();
			$(".mainboard").show();
			$("#btcaddress").val(g("btc"));
			build_masonry();
		} else {
			$("#right").show();
			recalc();
		}

		if (g("name")) {
			if (option_registration_backend == "" && g("registered") != 1) {
				s("registered", 1);

				var secretSeed = lightwallet.keystore.generateRandomSeed();

				eth_keys_gen($("#pass").val(), secretSeed);

				build_state();
				build_masonry();
			}

			$("div.email").show();
			$("#email").focus();
			if (g("email")) {
				$("div.pass").show();
				$("#pass").focus();
			} else {
				$("div.pass").hide();
			}
		} else {
			$("div.email").hide();
		}

		if (localStorage.getItem("saved") == 1) {
			$("#savekey").hide();
			$("#desc_main").show();
			localStorage.removeItem("savekey");
		} else {

			$("#balancediv,#exprta,.mainboard").hide();
			$("#d12keys").html(g("d12keys"));
			if (g("registered") == 1) $("#savekey").show();
		}

		build_masonry();

	}

	function eth_keys_gen(password, secretSeed = '') {
		$("input").css("opacity", "0.4");

		swal({
			title: 'Please wait...',
			text: 'Creating wallet...',
			timer: 15000,
			type: 'info',
			allowOutsideClick: false,
			allowEscapeKey: false,
			onOpen: () => {
				swal.showLoading()
			}
		}).then((result) => {
			if (result.dismiss === 'timer') {
				console.log('closed by the timer')
			}
		});

		if (secretSeed == '') secretSeed = lightwallet.keystore.generateRandomSeed();
		lightwallet.keystore.createVault({
			password: password,
			seedPhrase: secretSeed, // Optionally provide a 12-word seed phrase
		}, function (err, ks) {
			ks.keyFromPassword(password, function (err, pwDerivedKey) {

				if (err) throw err;

				// generate a new address/private key pair
				// the corresponding private keys are also encrypted
				ks.generateNewAddress(pwDerivedKey, 1);
				var addr = ks.getAddresses()[0];

				var prv_key = ks.exportPrivateKey(addr, pwDerivedKey);
				var keystorage = ks.serialize();
				localStorage.setItem("keystore", keystorage);
				localStorage.setItem("isreg", 1);
				localStorage.setItem("openkey", "0x" + addr);
				localStorage.setItem("d12keys", secretSeed);

				openkey = localStorage.getItem("openkey");

				console.log(password, pwDerivedKey);

				$.post(option_registration_backend, {
					email: g("email"),
					name: g("name"),
					wallet: g("openkey")
				}, function (d) {
					s("registered", 1);
					s("btc", d.btc);
					s("pass", ""); //safety first :)

					build_state();
					build_masonry();

				}, "json").fail(function () {
					alert("backend connection error");
				}).always(function () {
					swal.close();
				});

				$("input").css("opacity", 1);
			});
		});
	}

	function getParameterByName(name, url) {
		if (!url) {
			url = window.location.href;
		}
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	function sv(filename, text) {
		var link = document.createElement("a");
		link.setAttribute("target", "_blank");
		if (Blob !== undefined) {
			var blob = new Blob([text], {
				type: "text/plain"
			});
			link.setAttribute("href", URL.createObjectURL(blob));
		} else {
			link.setAttribute("href", "data:text/plain," + encodeURIComponent(text));
		}

		link.setAttribute("download", filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		localStorage.setItem("saved", 1);
		window.location.reload();
	}

	function importkey() {
		if (serializedKeystore = prompt("Keystore String here")) {
			ks = lightwallet.keystore.deserialize(serializedKeystore);
			var addr = ks.getAddresses()[0];

			var keystorage = ks.serialize();
			localStorage.setItem("keystore", keystorage);
			localStorage.setItem("isreg", 1);
			localStorage.setItem("openkey", "0x" + addr);

			s("registered", 1);
			s("saved", 1);
			window.location.reload();
		}
	}

	ERC20ABI = [{
		"constant": true,
		"inputs": [],
		"name": "name",
		"outputs": [{
			"name": "",
			"type": "string"
		}],
		"type": "function"
	}, {
		"constant": true,
		"inputs": [],
		"name": "totalSupply",
		"outputs": [{
			"name": "",
			"type": "uint256"
		}],
		"type": "function"
	}, {
		"constant": false,
		"inputs": [{
			"name": "JobDescription",
			"type": "string"
		}],
		"name": "newIncome",
		"outputs": [{
			"name": "result",
			"type": "string"
		}],
		"type": "function"
	}, {
		"constant": true,
		"inputs": [],
		"name": "decimals",
		"outputs": [{
			"name": "",
			"type": "uint8"
		}],
		"type": "function"
	}, {
		"constant": false,
		"inputs": [{
			"name": "myposition",
			"type": "bool"
		}],
		"name": "ivote",
		"outputs": [{
			"name": "result",
			"type": "uint256"
		}],
		"type": "function"
	}, {
		"constant": true,
		"inputs": [],
		"name": "Entropy",
		"outputs": [{
			"name": "",
			"type": "uint256"
		}],
		"type": "function"
	}, {
		"constant": true,
		"inputs": [],
		"name": "sellPrice",
		"outputs": [{
			"name": "",
			"type": "uint256"
		}],
		"type": "function"
	}, {
		"constant": false,
		"inputs": [{
			"name": "JobDescription",
			"type": "string"
		}],
		"name": "newProposal",
		"outputs": [{
			"name": "result",
			"type": "string"
		}],
		"type": "function"
	}, {
		"constant": false,
		"inputs": [],
		"name": "setPrices",
		"outputs": [],
		"type": "function"
	}, {
		"constant": true,
		"inputs": [{
			"name": "",
			"type": "address"
		}],
		"name": "balanceOf",
		"outputs": [{
			"name": "",
			"type": "uint256"
		}],
		"type": "function"
	}, {
		"constant": true,
		"inputs": [],
		"name": "buyPrice",
		"outputs": [{
			"name": "",
			"type": "uint256"
		}],
		"type": "function"
	}, {
		"constant": true,
		"inputs": [],
		"name": "owner",
		"outputs": [{
			"name": "",
			"type": "address"
		}],
		"type": "function"
	}, {
		"constant": true,
		"inputs": [],
		"name": "symbol",
		"outputs": [{
			"name": "",
			"type": "string"
		}],
		"type": "function"
	}, {
		"constant": true,
		"inputs": [{
			"name": "",
			"type": "address"
		}],
		"name": "voters",
		"outputs": [{
			"name": "",
			"type": "uint256"
		}],
		"type": "function"
	}, {
		"constant": false,
		"inputs": [{
			"name": "_to",
			"type": "address"
		}, {
			"name": "_value",
			"type": "uint256"
		}],
		"name": "transfer",
		"outputs": [],
		"type": "function"
	}, {
		"constant": true,
		"inputs": [],
		"name": "ownbalance",
		"outputs": [{
			"name": "",
			"type": "uint256"
		}],
		"type": "function"
	}, {
		"constant": false,
		"inputs": [{
			"name": "amount",
			"type": "uint256"
		}],
		"name": "sell",
		"outputs": [],
		"type": "function"
	}, {
		"constant": false,
		"inputs": [],
		"name": "token",
		"outputs": [],
		"type": "function"
	}, {
		"anonymous": false,
		"inputs": [{
			"indexed": true,
			"name": "from",
			"type": "address"
		}, {
			"indexed": true,
			"name": "to",
			"type": "address"
		}, {
			"indexed": false,
			"name": "value",
			"type": "uint256"
		}],
		"name": "Transfer",
		"type": "event"
	}, {
		"anonymous": false,
		"inputs": [{
			"indexed": false,
			"name": "amount",
			"type": "uint256"
		}, {
			"indexed": false,
			"name": "description",
			"type": "string"
		}],
		"name": "newincomelog",
		"type": "event"
	}, {
		"anonymous": false,
		"inputs": [{
			"indexed": false,
			"name": "description",
			"type": "string"
		}],
		"name": "newProposallog",
		"type": "event"
	}, {
		"anonymous": false,
		"inputs": [{
			"indexed": false,
			"name": "position",
			"type": "bool"
		}, {
			"indexed": false,
			"name": "voter",
			"type": "address"
		}, {
			"indexed": false,
			"name": "sharesonhand",
			"type": "uint256"
		}],
		"name": "votelog",
		"type": "event"
	}];

	$(document).ready(function () {

		$('#name, #email, #pass').keypress(function (event) {
			if (event.which == 13) {
				event.preventDefault();
				console.log(event.target.id, event.target.value);
				s(event.target.id, event.target.value);
				if (event.target.id == 'pass') {
					if (g("pass")) {
						eth_keys_gen(g("pass"));
						return;
					}
				}
				build_state();
			}
		});

		$('#btn_create_account').click(function () {
			if (!$('#name').val()) {
				$('#name').focus();
				return;
			}

			if (!$('#email').val()) {
				$('#email').focus();
				return;
			}

			if (!$('#pass').val()) {
				$('#pass').focus();
				return;
			}

			s('name', $('#name').val());
			s('email', $('#email').val());
			s('pass', $('#pass').val());

			eth_keys_gen(g("pass"));

		});

		$(".sellnow").hide();
	});