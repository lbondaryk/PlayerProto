# Registering Player to DEV
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar  -m POST \
	-h "Content-Type: application/vnd.pearson.paf.v1.player+json" \
	-d sanvan_player.json \
	-u http://hub.paf.dev.pearsoncmg.com/paf-hub/resources/players -c

# Registering an Activity. Notice the extra \" due to bug in commons-cli: https://issues.apache.org/jira/browse/CLI-185
# Should return ID: http://repo.paf.dev.pearsoncmg.com/paf-repo/resources/activities/sanvan.neff.1
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m POST \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.sanvan.v1.activity\"\"" \
	-d sanvan_neff_item_1.activity.json \
	-u http://repo.paf.dev.pearsoncmg.com/paf-repo/resources/activities -c

# Registering an Assignment
# Should return ID: http://repo.paf.dev.pearsoncmg.com/paf-repo/resources/activities/sanvan.assignment.1
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m POST \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.paf.v1.assignment+json\"\"" \
	-d sanvan_neff.assign.json \
	-u http://repo.paf.dev.pearsoncmg.com/paf-repo/resources/activities -c

#To retrieve
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m GET \
	-u http://repo.paf.dev.pearsoncmg.com/paf-repo/resources/activities/sanvan.assignment.1 -c

#  PUT/DELETE Not working...
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m PUT \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.sanvan.v1.activity\"\"" \
	-d sanvan_neff_item_1.activity.json \
	-u http://repo.paf.dev.pearsoncmg.com/paf-repo/resources/activities -c

# Not working...
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m DELETE \
	-u http://repo.paf.cert.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.neff.1b

##########
# MultipleChoice Question
# @id: http://repo.paf.dev.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.activity.mcq1
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m POST \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.sanvan.v1.activity\"\"" \
	-d sanvan_mcq_item_1.activity.json \
	-u http://repo.paf.dev.pearsoncmg.com/paf-repo/resources/activities -c

# @id: http://repo.paf.dev.pearsoncmg.com/paf-repo/resources/activities/test.sanvan.assignment.mcq1
java -jar brix-tool-pafclient-0.1-jar-with-dependencies.jar -m POST \
	-h "Content-Type: application/vnd.pearson.paf.v1.envelope+json;body=\"application/vnd.pearson.paf.v1.assignment+json\"\"" \
	-d sanvan_mcq.assign.json \
	-u http://repo.paf.dev.pearsoncmg.com/paf-repo/resources/activities -c

