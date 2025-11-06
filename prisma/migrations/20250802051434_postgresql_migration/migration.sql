-- CreateTable
CREATE TABLE "AiQuestion" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "question" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "correct_ans" TEXT NOT NULL,
    "area" TEXT,
    "sub_area" TEXT,
    "topic" TEXT,
    "sub_topic" TEXT,
    "concept" TEXT,
    "changes" TEXT,
    "filename" TEXT,
    "filepath" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "file_type" TEXT,
    "concept_filename" TEXT,
    "concept_filepath" TEXT,
    "user_id" INTEGER,
    "vocabulary_words" TEXT,
    "vocabulary_hobby" TEXT,
    "vocabulary_paragraph" TEXT,
    "status" INTEGER NOT NULL DEFAULT 0,
    "deleted" INTEGER NOT NULL DEFAULT 0,
    "timestamp" VARCHAR(10),
    "pageNumber" INTEGER,

    CONSTRAINT "AiQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "USER_ID" SERIAL NOT NULL,
    "USER_NAME" TEXT,
    "PASSWORD" TEXT,
    "OFFICIAL_EMAIL" TEXT,
    "PERSONAL_EMAIL" TEXT,
    "MOBILE" TEXT,
    "FIRST_NAME" TEXT,
    "LAST_NAME" TEXT,
    "STATUS" INTEGER,
    "ROLE" TEXT,
    "USER_PHOTO" TEXT,
    "CREATED_DATE" TIMESTAMP(3),
    "CREATED_BY" INTEGER,
    "LAST_MODIFIED_DATE" TIMESTAMP(3),
    "LAST_MODIFIED_BY" INTEGER,
    "PROFILE_PIC" TEXT,
    "UPDATED_DATE" TIMESTAMP(3),
    "USER_DETAILS" TEXT,
    "BATCH_NAME" TEXT,
    "BATCH_CODE" TEXT,
    "LICENSE_KEY" TEXT,
    "VALIDITY_START_DATE" TIMESTAMP(3),
    "VALIDITY_END_DATE" TIMESTAMP(3),
    "MOBILE_NUMBER" TEXT,
    "EMAIL" TEXT,
    "CITY" TEXT,
    "STATE" TEXT,
    "ADDRESS" TEXT,
    "GRADE" INTEGER,
    "DATE_OF_BIRTH" TIMESTAMP(3),
    "GENDER" TEXT,
    "PASSWORD_MODIFIED_DATE" TIMESTAMP(3),
    "REFERRAL_CODE" TEXT,
    "MY_REFERRAL_CODE" TEXT,
    "UPDATED_BY" INTEGER,
    "XP_POINTS" BIGINT,
    "XP_LEVEL" TEXT,
    "COINS" BIGINT,
    "LAST_STREAK" INTEGER,
    "LONGEST_STREAK" INTEGER,
    "CURRENT_STREAK" INTEGER,
    "LAST_LOGGEDIN_DATE" TIMESTAMP(3),
    "MINUTES_VIEWED" INTEGER,
    "FCM_TOKEN" TEXT,
    "SCHOOL_NAME" TEXT,
    "DEGREE" TEXT,
    "DISCIPLINE" TEXT,
    "YEAR" TEXT,
    "MODULE" TEXT,
    "USER_DATA" TEXT,
    "COLLEGE_CODE" TEXT,
    "COLLEGE_NAME" TEXT,
    "SUBSCRIPTION_TYPE" TEXT,
    "BATCH_TYPE" TEXT,
    "GRNNo" TEXT,
    "UserLastLoginTime" TIMESTAMP(3),
    "emp_id" TEXT,
    "Reporting_Manager" TEXT,
    "displayname" TEXT,
    "Otp" INTEGER,
    "USER_RESUME" TEXT,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("USER_ID")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" INTEGER,
    "latestAccessTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sidenav" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "images_data" BYTEA,
    "images" TEXT,
    "sub_name" VARCHAR(255),
    "role" TEXT,
    "icon_name" TEXT,

    CONSTRAINT "sidenav_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "SETTING_ID" SERIAL NOT NULL,
    "SUB_DOMAIN" TEXT NOT NULL,
    "SETTINGS_JSON" TEXT,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("SETTING_ID")
);

-- CreateTable
CREATE TABLE "SUBJECTS" (
    "subject_id" SERIAL NOT NULL,
    "subject_description" VARCHAR(100),
    "subject_code" VARCHAR(10),
    "REQUIRE_RESOURCE" INTEGER,
    "test_type" VARCHAR(10),

    CONSTRAINT "SUBJECTS_pkey" PRIMARY KEY ("subject_id")
);

-- CreateTable
CREATE TABLE "EVAL_QUESTIONS" (
    "QUESTION_ID" SERIAL NOT NULL,
    "SUBJECT_ID" INTEGER NOT NULL,
    "TOPIC_ID" INTEGER NOT NULL,
    "QUESTION_NUMBER" VARCHAR(20),
    "QUESTION" TEXT NOT NULL,
    "CHOICE1" TEXT NOT NULL,
    "CHOICE2" TEXT NOT NULL,
    "CHOICE3" TEXT NOT NULL,
    "CHOICE4" TEXT NOT NULL,
    "ANSWER" TEXT NOT NULL,
    "COMPLEXITY" INTEGER,
    "QUESTION_SOURCE" TEXT,
    "LINK" VARCHAR(200),
    "CREATED_DATE" TIMESTAMP(3),
    "CREATED_BY" INTEGER,
    "MODIFIED_DATE" TIMESTAMP(3),
    "MODIFIED_BY" INTEGER,
    "QUESTION_TYPE" VARCHAR(10),
    "PARENT_QUESTION_NUMBER" VARCHAR(20),
    "Help_text" TEXT,
    "HELP_FILES" VARCHAR(100),
    "OPTIONS" TEXT,
    "negative_marks" INTEGER,

    CONSTRAINT "EVAL_QUESTIONS_pkey" PRIMARY KEY ("QUESTION_ID")
);

-- CreateTable
CREATE TABLE "TEST_REPOSITORY_DETAILS" (
    "repository_details_id" SERIAL NOT NULL,
    "test_id" INTEGER,
    "subject_id" INTEGER,
    "question_count" INTEGER,
    "duration_min" INTEGER,
    "rendering_order" INTEGER,
    "selection_method" VARCHAR(10),
    "TOPIC_ID" VARCHAR(300),
    "REQUIRE_RESOURCE" INTEGER,
    "complexity" INTEGER,
    "subject_marks" INTEGER,

    CONSTRAINT "TEST_REPOSITORY_DETAILS_pkey" PRIMARY KEY ("repository_details_id")
);

-- CreateTable
CREATE TABLE "USER_TESTS" (
    "user_test_id" SERIAL NOT NULL,
    "test_id" INTEGER NOT NULL,
    "VALIDITY_START" TIMESTAMP(3),
    "VALIDITY_END" TIMESTAMP(3),
    "created_date" TIMESTAMP(3),
    "created_by" INTEGER,
    "USER_NAME" VARCHAR(100),
    "access" VARCHAR(100),
    "test_name" VARCHAR(15),
    "user_data" TEXT,
    "epi_data" TEXT,
    "distCount" INTEGER,
    "distSecs" INTEGER,
    "video" TEXT,
    "user_id" INTEGER,
    "BATCH_CODE" VARCHAR(100),
    "Module" VARCHAR(100),
    "LOGIN_WINDOW" TIMESTAMP(3),

    CONSTRAINT "USER_TESTS_pkey" PRIMARY KEY ("user_test_id")
);

-- CreateTable
CREATE TABLE "USER_TEST_DETAILS" (
    "record_id" SERIAL NOT NULL,
    "test_id" INTEGER,
    "subject_id" INTEGER,
    "user_test_id" INTEGER NOT NULL,
    "question_data" TEXT,
    "answer_data" TEXT,
    "created_date" TIMESTAMP(3),
    "modified_date" TIMESTAMP(3),
    "marks" DECIMAL(10,2),
    "timer_value" VARCHAR(10) DEFAULT '00:00',
    "video_path" TEXT,
    "review_status" INTEGER DEFAULT 0,
    "modified_by" VARCHAR(100),
    "FINAL_SCORE" VARCHAR(100),
    "RELEVENCE" INTEGER,
    "LOGICAL_CONSISTENCY" INTEGER,
    "GRAMMAR_SPELLING" INTEGER,

    CONSTRAINT "USER_TEST_DETAILS_pkey" PRIMARY KEY ("record_id")
);

-- CreateTable
CREATE TABLE "FileJob" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "input_type" TEXT NOT NULL,
    "request_data" TEXT NOT NULL,
    "response_data" TEXT NOT NULL,
    "response_time" TIMESTAMP(3),
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "api_endpoint" TEXT,
    "percentage" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FileJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TOPICS" (
    "TOPIC_ID" SERIAL NOT NULL,
    "TOPIC_DESCRIPTION" VARCHAR(100),
    "TOPIC_CODE" VARCHAR(200),
    "REQUIRE_RESOURCE" INTEGER,
    "TEST_TYPE" VARCHAR(10),

    CONSTRAINT "TOPICS_pkey" PRIMARY KEY ("TOPIC_ID")
);

-- CreateTable
CREATE TABLE "TEST_REPOSITORY" (
    "TEST_ID" SERIAL NOT NULL,
    "TEST_TYPE" VARCHAR(10),
    "TEST_DESCRIPTION" VARCHAR(200),
    "VALIDITY_START" TIMESTAMP(3),
    "VALIDITY_END" TIMESTAMP(3),
    "CREATED_DATE" TIMESTAMP(3),
    "CREATED_BY" INTEGER,
    "IS_RECURRING" INTEGER,
    "QUESTION_SELECTION_METHOD" VARCHAR(20),
    "STATUS" INTEGER,
    "TEST_CODE" VARCHAR(20),
    "TEST_TITLE" VARCHAR(100),
    "TEST_ICON" VARCHAR(100),
    "LANGUAGE" VARCHAR(30),
    "general_data" TEXT,
    "role" INTEGER,
    "master_data" TEXT,
    "epi_question" TEXT,
    "video" INTEGER,
    "COLLEGE_CODE" VARCHAR(100),
    "COLLEGE_NAME" VARCHAR(500),
    "Module" INTEGER,
    "LINK_TEST" INTEGER,
    "IP_RESTRICTION" INTEGER,
    "IP_ADDRESSES" TEXT,

    CONSTRAINT "TEST_REPOSITORY_pkey" PRIMARY KEY ("TEST_ID")
);

-- CreateTable
CREATE TABLE "TEST_PATTERN" (
    "PATTERN_ID" SERIAL NOT NULL,
    "TEST_ID" INTEGER,
    "SUBJECT_ID" VARCHAR(100),
    "QUESTION_COUNT" INTEGER,
    "DURATION_MIN" INTEGER,
    "DIFFICULTY_LEVEL" INTEGER,
    "STATUS" INTEGER,
    "MAX_MARKS" INTEGER,

    CONSTRAINT "TEST_PATTERN_pkey" PRIMARY KEY ("PATTERN_ID")
);

-- CreateTable
CREATE TABLE "QUESTION_RESOURCES" (
    "RESOURCE_ID" SERIAL NOT NULL,
    "RESOURCE_TYPE" VARCHAR(10),
    "RESOURCE" TEXT,
    "RESOURCE_FILES" TEXT,
    "SUBJECT_ID" INTEGER,
    "resource_code" VARCHAR(100),
    "TOPIC_ID" VARCHAR(100),
    "COMPLEXITY" VARCHAR(10),

    CONSTRAINT "QUESTION_RESOURCES_pkey" PRIMARY KEY ("RESOURCE_ID")
);
