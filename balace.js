/** СКРИПТ ИЗМЕНЕНИЯ БАЛАНСА СО СТРАНИЦЫ БАНКА
	https://github.com/4eDo/mybb/blob/main/edit_field_on_fly/readme.md
 	Версия от 2024-11-01
**/

const FIELD_ID_FOR_EDIT = "fld1";
const ADD_CACHE_TEXT = "Изменение баланса";
const COLOR_INPUT_TEXT = "color: #000000 !important";

const ALLOWED_TOPICS = ['63', '410']; // topic id (viewtopic.php?id=...)
const ALLOWED_FORUMS = ['7', '31'];         // forum id (viewforum.php?id=...)
const ALLOWED_GROUPS = [1];           // без кавычек

const OPERATIONS = [
	["Начисление", "1", "all"],
	["Списание", "-1", "all"],
];

const ROUND = 0;
const USE_WRAPPER = true;

const WRAPPER_START = `[spoiler="[table layout=auto width=100]
[tr]
[td][b]ОБРАБОТАНО[/b] ({{ADMIN_NAME}})[/td]
[td][b]Было[/b]: {{CACHE_BEFORE}}[/td]
[td][b]Стало[/b]: {{CACHE_AFTER}}[/td]
[/tr]
[/table]"]`;
const WRAPPER_END = `[/spoiler]`;

const ADMIN_NAMES = {
	2: "Самый главный",
	24: "Эллиот",
	26: "Кас",
	27: "Илай",
	28: "Блейни",
	49: "Лора",
	62: "Самир",
};

function getUrlParam(name){
	return new URLSearchParams(window.location.search).get(name);
}

function getCurrTopicId(){
	return getUrlParam('id');
}

function getCurrForumIdFromPage(){
	const links = document.querySelectorAll('a[href*="viewforum.php?id="]');
	for (let i = links.length - 1; i >= 0; i--){
		const href = links[i].getAttribute('href') || '';
		const m = href.match(/viewforum\.php\?id=(\d+)/i);
		if (m) return m[1];
	}
	return null;
}

function isNumericValue(v){
	if (v == null) return false;
	const s = String(v).trim();
	return /^-?\d+(\.\d+)?$/.test(s);
}

function extractProfileIdFromValue(v){
	if (v == null) return null;
	const s = String(v);

	// HTML / plain
	let m = s.match(/profile\.php\?id=(\d+)/i);
	if (m) return m[1];

	m = s.match(/\[url=[^\]]*profile\.php\?id=(\d+)[^\]]*\]/i);
	if (m) return m[1];

	m = s.match(/\b(\d{1,10})\b/);
	if (m) return m[1];

	return null;
}

function roundValue(val){
	if (ROUND === 0) return parseInt(val, 10);
	return Number.isInteger(val) ? val : parseFloat(val.toFixed(ROUND));
}

function getFormFieldsSync(url, selector){
	const data = {};
	$.ajax({
		url,
		method: "get",
		async: false,
		success: function(html){
			const doc = (new DOMParser()).parseFromString(html, "text/html");
			const form = doc.querySelector(selector);
			if (!form) throw new Error(`Форма '${selector}' не найдена.`);
			const fd = new FormData(form);
			for (const [k, v] of fd.entries()) data[k] = v;
		},
		error: function(_, status, err){
			console.error("Ошибка при выполнении AJAX-запроса:", status, err);
			throw new Error(`Ошибка при загрузке страницы ${url} : ${status}`);
		}
	});
	return data;
}

async function postForm(url, fieldsObj){
	const fd = new FormData();
	for (const k in fieldsObj) fd.append(k, fieldsObj[k]);

	try{
		const body = (() => {
			const arr = [];
			for (const [name, value] of fd.entries()) arr.push({name, value});
			const $f = $("<form>");
			$.each(arr, function(_, it){
				$f.append($("<input>").attr({type:"hidden", name: it.name, value: it.value}));
			});
			return $f.serialize2();
		})();

		const res = await fetch(url, {
			method: "POST",
			body,
			headers: {"Content-Type":"application/x-www-form-urlencoded"}
		});
		if (!res.ok){
			console.error("Ошибка отправки данных:", res.statusText);
			return false;
		}
		return true;
	}catch(e){
		console.error("Ошибка отправки данных:", e);
		return false;
	}
}

function topicAllowed(currTopicId){
	return !!currTopicId && ALLOWED_TOPICS.includes(currTopicId);
}

function forumAllowed(currForumId){
	return !!currForumId && ALLOWED_FORUMS.includes(currForumId);
}

function operationAllowedInTopic(op, currTopicId){
	const scope = op[2];
	if (scope === "all") return true;
	if (!currTopicId) return false;
	return scope.split(" ").includes(currTopicId);
}

function buildOperationSelect(currTopicId, idx){
	const $select = $("<select></select>")
		.attr("id", `select-type-${idx}`);

	$select.append('<option value="0">Не выбрано</option>');

	for (let i = 0; i < OPERATIONS.length; i++){
		if (!operationAllowedInTopic(OPERATIONS[i], currTopicId)) continue;
		const label = OPERATIONS[i][0];
		const coef = OPERATIONS[i][1];
		$select.append(
			`<option value="${coef}">${label} (${coef > 0 ? "+" : ""}${coef})</option>`
		);
	}
	return $select;
}

async function doChangeBalanceAndMaybeWrap({coef, count, payoutUserId, postId, $out}){
	const backUrl = document.URL;
	const profileFormSel = "#profile8";
	const fieldName = `form[${FIELD_ID_FOR_EDIT}]`;

	const profileUrl = "/profile.php?section=fields&id=" + payoutUserId;
	const profileFields = getFormFieldsSync(profileUrl, profileFormSel);

	const before = parseFloat(profileFields[fieldName]) || 0;
	const after = roundValue(before + parseFloat(coef) * parseInt(count, 10));

	profileFields[fieldName] = `${after}`;

	let html =
		'<table class="editOnFly_success" border="1" style="margin-top: 10px;">' +
		`<tr><td>Тип операции:</td><td>${coef > 0 ? "начисление (+" : "списание ("} ${parseFloat(coef)})</td></tr>` +
		`<tr><td>Количество:</td><td>${count}</td></tr>` +
		`<tr><td>Было:</td><td>${before}</td></tr>` +
		`<tr><td>Стало:</td><td>${after}</td></tr>` +
		'</table>' +
		"<p>Новые значения будут видны после обновления страницы.</p>";

	if (USE_WRAPPER) html += "<p><strong>Оборачиваем сообщение.</strong></p>";

	history.replaceState(null, null, profileUrl);
	setTimeout(() => history.replaceState(null, null, backUrl), 1000);

	const ok1 = await postForm(profileUrl, profileFields);
	if (!ok1) throw new Error("Произошла ошибка при отправке данных.");

	$out.append($(html));

	if (USE_WRAPPER){
		const editUrl = "/edit.php?id=" + postId;
		const editFormSel = "#post";
		const editFields = getFormFieldsSync(editUrl, editFormSel);

		const msgKey = "req_message";
		const original = editFields[msgKey];

		let wrapped = WRAPPER_START + original + WRAPPER_END;
		wrapped = wrapped
			.replaceAll("{{CACHE_BEFORE}}", before)
			.replaceAll("{{CACHE_AFTER}}", after)
			.replaceAll("{{ADMIN_NAME}}", ADMIN_NAMES[UserID] || UserLogin);

		editFields[msgKey] = wrapped;

		history.replaceState(null, null, editUrl);
		setTimeout(() => history.replaceState(null, null, backUrl), 1000);

		const ok2 = await postForm(editUrl, editFields);
		if (!ok2) throw new Error("Произошла ошибка при оборачивании сообщения.");

		$out.append($("<p>Сообщение обёрнуто.</p>"));
	}
}

$(document).ready(function(){
	const currTopicId = getCurrTopicId();
	const currForumId = getCurrForumIdFromPage();

	const allowGroup = ALLOWED_GROUPS.includes(GroupID);
	const allow = allowGroup && (topicAllowed(currTopicId) || forumAllowed(currForumId));

	if (!allow){
		$("#efof").remove();
		return;
	}

	console.group("4eDo script edit_field_on_fly ");
	console.log("%c~~ Скрипт для быстрого начисления/списания средств. %c https://github.com/4eDo ~~","font-weight: bold;","font-weight: bold;");
	console.groupEnd();

	const $ratings = $(".post-rating");
	let idx = 0;

	$ratings.each(function(){
		const $rating = $(this);
		const $postWrap = $rating.closest("[data-user-id]");
		const postUserId = String($postWrap.data("user-id") || "");
		const postId = ($postWrap.attr("id") || "").slice(1);

		const $box = $("<div></div>");

		const $btnOpen = $('<input type="button" />')
			.addClass("edit_on_fly button preview")
			.val(ADD_CACHE_TEXT)
			.css("cursor","pointer");

		const $select = buildOperationSelect(currTopicId, idx);
		const $pType = $("<p>Тип операции: </p>").hide().append($select);

		const $input = $('<input type="number" min="0" step="1" />')
			.attr("style", COLOR_INPUT_TEXT)
			.attr("id", `input-count-${idx}`);

		const $pCount = $("<p>Количество: </p>").hide().append($input);

		const $btnDo = $('<input type="button" />')
			.addClass("edit_on_fly button submit")
			.val("Выполнить")
			.hide()
			.css("cursor","pointer");

		$btnOpen.on("click", function(){ $pType.show(); });

		$select.on("change", function(){
			$pCount.toggle("0" !== $select.val());
		});

		$input.on("input", function(){
			$btnDo.toggle($input.val() > 0);
		});

		$btnDo.on("click", function(){
			const coef = $select.val();
			const count = $input.val();

			$btnDo.prop("disabled", true);
			$pType.css({opacity:"0.5", "pointer-events":"none"});
			$pCount.css({opacity:"0.5", "pointer-events":"none"});
			$btnDo.css({opacity:"0.5", "pointer-events":"none"});

			(async () => {
				try{
					const profileFormSel = "#profile8";
					const fieldName = `form[${FIELD_ID_FOR_EDIT}]`;

					const rawProfileUrl = "/profile.php?section=fields&id=" + postUserId;
					const rawFields = getFormFieldsSync(rawProfileUrl, profileFormSel);
					const rawVal = rawFields[fieldName];

					let payoutUserId = postUserId;
					if (!isNumericValue(rawVal)){
						const mainId = extractProfileIdFromValue(rawVal);
						if (mainId) payoutUserId = String(mainId);
					}

					await doChangeBalanceAndMaybeWrap({
						coef,
						count,
						payoutUserId,
						postId,
						$out: $box
					});
				}catch(err){
					$box.append($(`<p class="editOnFly_error">${err}</p>`));
				}
			})();
		});

		$box.append($btnOpen, $pType, $pCount, $btnDo);
		$rating.after($box);
		idx++;
	});
});
